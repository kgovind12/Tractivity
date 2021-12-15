import barchart from './barchart.js'

let unitMap = {
    walk: 'Kilometers',
    run: 'Kilometers',
    swim: 'Laps',
    bike: 'Kilometers',
    yoga: 'Minutes',
    soccer: 'Minutes',
    basketball: 'Minutes',
}

let actionMap = {
    walk: 'Walked',
    run: 'Ran',
    swim: 'Swam',
    bike: 'Biked',
    yoga: 'of Yoga',
    soccer: 'of Soccer',
    basketball: 'of Basketball',
}

let reminderMap = {
    walk: 'Walk',
    run: 'Run',
    swim: 'Swim',
    bike: 'Bike',
    yoga: 'Practice yoga',
    soccer: 'Play soccer',
    basketball: 'Play basketball',
}

let dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

barchart.init('chart-anchor', 1000, 300);

// Reminders
let newReminder = await checkForReminders()

// Dismiss reminder 
document.getElementById('dismiss').addEventListener('click', function() {
    document.getElementById('reminder-card').classList.add('hide');
});


/* Set default date in forms to current date */
document.getElementById('viewProgress-date').valueAsDate = newUTCDate();

//defaults
renderBarChart();

document.getElementById('view-activity-this-week-dropdown').addEventListener('change', renderBarChart);
document.getElementById('viewProgress-date').addEventListener('change', renderBarChart);

// Render first chart
async function renderBarChart() {
    let searchParams = {
        activity: document.getElementById('view-activity-this-week-dropdown').value.toLowerCase(),
        date: (new Date(
            document.getElementById('viewProgress-date')
                .value
                .replace(/-/g,'/')
        )).getTime()
    }

    console.log("date from param = ", searchParams.date);
    console.log("current date = ", newUTCDate().getTime());

    /* Determine Y-Axis Label */
    let unit = unitMap[searchParams.activity] || 'none'
    let action = actionMap[searchParams.activity] || 'none'
    
    /* Fetch Activity Data for Week leading up to selected date */
    let dataOneWeek = await getDataForOneWeek(searchParams.date, searchParams.activity)
    if (searchParams.date + 0 * 86400000  <= newUTCDate().getTime()) {
        barchart.render(dataOneWeek, `${unit} ${action}`, 'Day of the Week');
    } else {
        alert('Date is too recent')
    }
}

async function renderLineGraph() {
    let searchParams = {
        activity: document.getElementById('view-activity-dropdown'),
        date: (new Date(
            document.getElementById('viewProgress-date')
                .value
                .replace('-','/')
        )).getTime()
    }

    /* Determine Y-Axis Label */
    let unit = unitMap[searchParams.activity] || 'none'
    let action = actionMap[searchParams.activity] || 'none'
    
    /* Fetch Activity Data for Week leading up to selected date */
    let data = await getAllData(searchParams.date, searchParams.activity)
    if (searchParams.date + 0 * 86400000  <= newUTCDate().getTime()) {
        // TODO: RENDER LINE GRAPH HERE
        // barchart.render(data, `${unit} ${action}`, 'Day of the Week');
    } else {
        alert('Date is too recent in line graph')
    }
}


// Fetch data for one week
async function getDataForOneWeek(date, activity = null) {
    let endpoint = `/week?date=${date}`

    if (activity != null) {
        endpoint += `&activity=${activity}`
    }

    /* Get Activity Reminder from Server */
    let response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.json();
}

// Fetch all data
async function getAllData() {
    let response = await fetch('/all', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.json();
}

/**
 * Asks server if there are any pendiing activities to complete. if there are
 * then a reminder section will be shown on the webpage to remind the user to
 * complete the activity
 */
 async function checkForReminders() {
    let mostRecent = await getReminder()

    if (mostRecent.message) {
        return 
    }
    
    /* Determine date relative to current date */
    let day = 'yesterday'
    if (mostRecent.date != newUTCDate().getTime() - 86400000) {
        day = dayOfWeek[(new Date(mostRecent.date)).getDay()]
    }

    /* Update text prompt of reminder section */
    document.getElementById('reminder-card').classList.remove('hide');
    let reminderQuestion = document.getElementById('reminder');
    let mostRecentActivity = reminderMap[mostRecent.activity.toLowerCase()]
    reminderQuestion.textContent = `${mostRecentActivity} on ${day}!`

    return {
      activity: mostRecent.activity,
      date: mostRecent.date
    }
}

/**
 * Get Activity Reminder from Server 
 */
 function getReminder() {
    return new Promise((resolve, reject) => {
        fetch(`/reminder`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json'
            }
        })
        .then(response => {
          console.log(response);
          return response.json();})
        .then(data => {
            console.log('Reminder Success:', data);
            resolve(data)
        })
        .catch((error) => {
            console.error('Reminder Error:', error);
            resolve(error)
       })
   });
}

/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
 function newUTCDate() {
    let gmtDate = new Date()
    return new Date(gmtDate.toLocaleDateString())
}

/**
 * Capitalizes the first character of a string s
 * @param {string} s - string to capitalize
 * @returns {string} capitalized
 */
 function capitalize(s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}