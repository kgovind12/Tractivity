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

let badgeMap = {
    'easy': ['Starter Spirit', 'Completed 10 days of easy workouts', 'badge-red'],
    'medium': ['Go Getter', 'Completed 10 days of medium workouts', 'badge-blue'],
    'hard': ['Motivation Master', 'Completed 10 days of hard workouts', 'badge-purple']
}

let dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const badgesContainer = document.getElementById('badges');

barchart.init('chart-anchor', 1000, 300);

// Reminders
let newReminder = await checkForReminders()

// Dismiss reminder 
document.getElementById('dismiss').addEventListener('click', function() {
    document.getElementById('reminder-card').classList.add('hide');
});

// Set default date for datepicker as current date
document.getElementById('viewProgress-date').valueAsDate = newUTCDate();

//defaults
renderBarChart();
getBadges();

// Update the bar chart every time the form values are changed
document.getElementById('view-activity-this-week-dropdown').addEventListener('change', renderBarChart);
document.getElementById('viewProgress-date').addEventListener('change', renderBarChart);

async function getBadges() {
    let entries = await getAllPastEntries();
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    for (let entry of entries) {
        if (entry.difficulty === 'easy') {
            easyCount++;
        } else if (entry.difficulty === 'medium') {
            mediumCount++;
        } else if (entry.difficulty === 'hard') {
            hardCount++;
        }
    }

    if (easyCount >= 10) {
        showBadge('easy');
    }
    if (mediumCount >= 10) {
        showBadge('medium');
    }
    if (hardCount >= 10) {
        showBadge('hard');
    }
}

// Render bar chart
async function renderBarChart() {
    let searchParams = {
        activity: document.getElementById('view-activity-this-week-dropdown').value.toLowerCase(),
        date: (new Date(
            document.getElementById('viewProgress-date')
                .value
                .replace(/-/g,'/')
        )).getTime()
    }

    // Determine Y-Axis Label
    let unit = unitMap[searchParams.activity] || 'none'
    let action = actionMap[searchParams.activity] || 'none'
    
    // Fetch Activity Data for Week leading up to selected date
    let dataOneWeek = await getDataForOneWeek(searchParams.date, searchParams.activity)
    if (searchParams.date + 0 * 86400000  <= newUTCDate().getTime()) {
        barchart.render(dataOneWeek, `${unit} ${action}`, 'Day of the Week');
    } else {
        alert('Date is too recent')
    }
}

// Fetch data for one week
async function getDataForOneWeek(date, activity = null) {
    let endpoint = `/week?date=${date}`

    if (activity != null) {
        endpoint += `&activity=${activity}`
    }

    // Get Activity Reminder from Server
    let response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.json();
}

// Fetch all past data
async function getAllPastEntries() {
    let response = await fetch('/allpast', {
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
            return response.json();
        })
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

// Displays the badge depending on difficulty level completed
function showBadge(difficulty) {
    let badge = document.createElement('div');
    badge.className = `badge ${badgeMap[difficulty][2]}`;

    let icon = document.createElement('i');
    icon.className = 'fas fa-medal';

    let badgeText = document.createElement('div');
    badgeText.className = 'badge-text';

    let badgeTitle = document.createElement('h3');
    badgeTitle.textContent = badgeMap[difficulty][0];

    let badgeDesc = document.createElement('p');
    badgeDesc.textContent = badgeMap[difficulty][1];

    badgeText.appendChild(badgeTitle);
    badgeText.appendChild(badgeDesc);

    badge.appendChild(icon);
    badge.appendChild(badgeText);
    badgesContainer.appendChild(badge);
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