//jshint esversion:6

'use strict'

const express = require('express');
const passport = require('passport');
const cookieSession = require('cookie-session');
const GoogleStrategy = require('passport-google-oauth20');

// our database operations
const dbo = require('./databaseOps');

// Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// functions that verify activities before putting them in database
const act = require('./activity');

// environment
const dotenv = require('dotenv');
require('dotenv').config();

const MS_IN_DAY = 86400000

// Google login credentials, used when the user contacts
// Google, to tell them where he is trying to login to, and show
// that this domain is registe`red for this service. 
// Google will respond with a key we can use to retrieve profile
// information, packed into a redirect response that redirects to
// server162.site:[port]/auth/redirect
const hiddenClientID = process.env.ClientID;
const hiddenClientSecret = process.env.ClientSecret;
let usrProfile;

// An object giving Passport the data Google wants for login.  This is 
// the server's "note" to Google.
const googleLoginData = {
    clientID: hiddenClientID,
    clientSecret: hiddenClientSecret,
    callbackURL: '/auth/accepted',
    proxy: true
};

// Tell passport we will be using login with Google, and
// give it our data for registering us with Google.
// The gotProfile callback is for the server's HTTPS request
// to Google for the user's profile information.
// It will get used much later in the pipeline. 
passport.use(new GoogleStrategy(googleLoginData, gotProfile) );


// app is the object that implements the express server
const app = express();

// pipeline stage that just echos url, for debugging
// app.use('/', printURL);


// Check validity of cookies at the beginning of pipeline
// Will get cookies out of request object, decrypt and check if 
// session is still going on. 
app.use(cookieSession({
    maxAge: 6 * 60 * 60 * 1000, // Six hours in milliseconds
    // after this user is logged out.
    // meaningless random string used by encryption
    keys: ['hanger waldo mercy dance']  
}));

// Initializes passport by adding data to the request object
app.use(passport.initialize()); 

// If there is a valid cookie, this stage will ultimately call deserializeUser(),
// which we can use to check for a profile in the database
app.use(passport.session()); 

// use this instead of the older body-parser
app.use(express.json());

// make all the files in 'public' available on the Web
app.use(express.static('public'))


// All database stuff here
// This is where the server recieves and responds to store POST requests
app.post('/store', isAuthenticated, async function(request, response, next) {
    console.log("Server recieved a post request at", request.url);
    console.log("request body = ", request.body);

    let activity = act.Activity(request.body)
    let useridProfile = request.user.useridData;

    await dbo.post_activity(activity, useridProfile)

    response.send({ message: "I got your POST request"});
});

// Delete entry from database
app.post('/delete', isAuthenticated, async function(request, response, next) {
    console.log("Server received a post request at", request.url);
    console.log("request body = ", request.body);

    let postDate = request.body.postDate;
    let userIdProfile = request.user.useridData;

    await dbo.delete_activity(postDate, userIdProfile);
    
    response.send({message: "Activity deleted."});
});


// Public static files - /public should just contain the splash page
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/public/splash.html");
});
  
app.get('/*',express.static('public'));

// next, handler for url that starts login with Google.
// The app (in public/login.html) redirects to here 
// (it's a new page, not an AJAX request!)
// Kicks off login process by telling Browser to redirect to
// Google. The object { scope: ['profile'] } says to ask Google
// for their user profile information.
app.get('/auth/google',
	passport.authenticate('google',{ scope: ['profile'] }));

// passport.authenticate sends off the 302 (redirect) response
// with fancy redirect URL containing request for profile, and
// client ID string to identify this app. 
// The redirect response goes to the browser, as usual, but the browser sends it to Google.  
// Google puts up the login page! 

// Google redirects here after user successfully logs in
// This route has three middleware functions. It runs them one after another.
app.get('/auth/accepted',
    // for educational purposes
    function (req, res, next) {
        console.log("at auth/accepted");
        next();
    },
    // This will issue Server's own HTTPS request to Google
	// to access the user's profile information with the 
	// temporary key we got in the request. 
	passport.authenticate('google'),
	// then it will run the "gotProfile" callback function,
	// set up the cookie, call serialize, whose "done" 
	// will come back here to send back the response
	// ...with a cookie in it for the Browser!

    function (req, res) {

        console.log("Inside auth profile has arrived: ",usrProfile);
        console.log('Logged in and using cookies!')
        // tell browser to get the hidden main page of the app
     
        console.log("Request Body: "+JSON.stringify(req.body));
        res.redirect(`/index.html?userName=${usrProfile.displayName}`);
    });

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/splash.html');
});

// static files in /user are only available after login
app.get('/*',
	isAuthenticated, // only pass on to following function if
	// user is logged in 
	// serving files that start with /user from here gets them from ./
	express.static('user')
); 

app.use(express.json());
app.get('/all', isAuthenticated, async function (req, res){
    let userIdProfile = req.user.useridData;
    let results = await dbo.get_all(userIdProfile);
    for (let result of results) {
        result.date = formatDate(result.date);
    }
    res.send(results);
}); 

// Home
app.get('/index.html', isAuthenticated, async function(req, res) {
    let userIdProfile = req.user.useridData;
    let profile = await dbo.get_profile(userIdProfile);
    res.redirect(`/index.html?userName=${profile[0].firstname}`);
});

app.get('/index', isAuthenticated, async function(req, res) {
    let userIdProfile = req.user.useridData;
    let profile = await dbo.get_profile(userIdProfile);
    res.redirect(`/index.html?userName=${profile[0].firstname}`);
});

// Get most recent entry from db
app.get('/reminder', isAuthenticated, async function(req, res) {
    console.log("Server is getting most recent entry");
    let userIdProfile = req.user.useridData;
    let result = await dbo.get_most_recent_entry(userIdProfile);

    // only get the reminder if it is a future activity
    if (result) {
        if (result.amount == -1 && result.units == -1) {
            result.date = formatDate(result.date);
        } else {
            result = null;
        }
    }

    res.send(result);
});

// This is where the server recieves and responds to week GET requests
app.get('/week', isAuthenticated, async function(request, response, next) {
    console.log("Server recieved a post request at", request.url);
  
    let date = parseInt(request.query.date)
    let activity = request.query.activity
    let useridProfile = request.user.useridData;
    
    /* Get Latest Activity in DB if not provided by query params */
    if (activity === undefined) {
      let result = await dbo.get_most_recent_entry(useridProfile)
      try {
        activity = result.activity
      } catch(error) {
        activity = "none"
      }
    }

    /* Get Activity Data for current Date and The Week Prior */
    let min = date - 6 * MS_IN_DAY
    let max = date
    let result = await dbo.get_similar_activities_in_range(activity, min, max, useridProfile)

    /* Store Activity amounts in Buckets, Ascending by Date */
    let data = Array.from({length: 7}, (_, i) => {
        return { date: date - i * MS_IN_DAY, value: 0 }
    })

    /* Fill Data Buckets With Activity Amounts */
    for(let i = 0 ; i < result.length; i++) {
        if (result[i].amount != -1) {
            let idx = Math.floor((date - result[i].date)/MS_IN_DAY)
            data[idx].value += result[i].amount
        }
    }
    
    // Send Client Activity for the Se;ected Week
    response.send(data.reverse());
});


// next, put all queries (like store or reminder ... notice the isAuthenticated 
// middleware function; queries are only handled if the user is logged in
app.get('/query', isAuthenticated,
    function (req, res) { 
      console.log("saw query");
      res.send('HTTP query!') });

// finally, file not found, if we cannot handle otherwise.
app.use( fileNotFound );


// listen for requests :)
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
    console.log("The static server is listening on port " + listener.address().port);
});

// function to check whether user is logged when trying to access
// personal data
function isAuthenticated(req, res, next) {
    if (req.user) {
      // user field is filled in in request object
      // so user must be logged in! 
	    console.log("user",req.user,"is logged in");
	    next();
    } else {
	res.redirect('/splash.html');  // send response telling
	// Browser to go to login page
    }
}

function gotProfile(accessToken, refreshToken, profile, done) {
    //console.log("Google profile has arrived",profile);
    // here is a good place to check if user is in DB,
    // and to store him in DB if not already there.
    // Second arg to "done" will be passed into serializeUser,
    // should be key to get user out of database.
    usrProfile = profile;
    let userid = profile.id;  
    console.log("userId: "+profile.displayName);
    done(null, userid); 
    
    dbo.store_profile(profile);
}

// Part of Server's sesssion set-up.  
// The second operand of "done" becomes the input to deserializeUser
// on every subsequent HTTP request with this session's cookie. 
passport.serializeUser((userid, done) => {
    console.log("SerializeUser. Input is",userid);
    done(null, userid);
});

// Called by passport.session pipeline stage on every HTTP request with
// a current session cookie. 
// Where we should lookup user database info. 
// Whatever we pass in the "done" callback becomes req.user
// and can be used by subsequent middleware.
passport.deserializeUser((userid, done) => {
    console.log("deserializeUser. Input is:", userid);
    // here is a good place to look up user data in database using
    // dbRowID. Put whatever you want into an object. It ends up
    // as the property "user" of the "req" object. 

    let useridData = {useridData: userid};
    done(null, useridData);

    // let userData = {userData: "data from user's db row goes here"};
    // done(null, userData);
});

// function for end of server pipeline
function fileNotFound(req, res) {
    let url = req.url;
    res.type('text/plain');
    res.status(404);
    res.send('Cannot find '+url);
}

// Convert from Unix time to JavaScript DateTime
function formatDate(timestamp) {
    const dateObject = new Date(timestamp)
    const dateTime = dateObject.toLocaleString();
    return dateTime.split(',')[0];
}
