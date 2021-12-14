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
    yoga: 'Practice Yoga',
    soccer: 'Play Soccer',
    basketball: 'Play Basketball',
}

let dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

barchart.init('chart-anchor', 1000, 300);

/* Set default date in forms to current date */
document.getElementById('viewProgress-date').valueAsDate = newUTCDate();

//defaults
renderBarChart();
// renderLineGraph();

document.getElementById('view-activity-this-week-dropdown').addEventListener('change', renderBarChart);
document.getElementById('view-activity-dropdown').addEventListener('change', renderLineGraph);
document.getElementById('viewProgress-date').addEventListener('change', renderLineGraph);

// Render first chart
async function renderBarChart() {
    let searchParams = {
        activity: document.getElementById('view-activity-this-week-dropdown').value.toLowerCase(),
        date: newUTCDate().getTime()
    }

    // console.log("Activity ", searchParams.activity);
    // console.log("Today's date = ", newUTCDate().getTime());
    // console.log("date = ", new Date(document.getElementById('viewProgress-date').value).getTime());

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
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
 function newUTCDate() {
    let gmtDate = new Date()
    return new Date(gmtDate.toLocaleDateString())
}