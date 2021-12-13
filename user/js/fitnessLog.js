'use strict'

/* Show add past activity overlay */
let addPastActBtn = document.getElementById("addPastActivity");
let pastActOverlay = document.getElementById('pastAct-overlay');
let overlayBackground = document.getElementById('overlay-bg');

let pastActSubmitBtn = document.getElementById('submitPastActivity');
let pastActDropdown = document.getElementById('pastAct-activity');

/* Set default date in forms to current date */
document.getElementById('pastAct-date').valueAsDate = newUTCDate()
// document.getElementById('fAct-date').valueAsDate = newUTCDate()

addPastActBtn.addEventListener("click", function() {
    pastActOverlay.classList.remove('hide');
    overlayBackground.classList.remove('hide');
});

document.getElementById('close').addEventListener('click', function() {
    pastActOverlay.classList.add('hide');
    overlayBackground.classList.add('hide');
});

pastActDropdown.addEventListener('change', function() {
    let pastActUnit = document.getElementById("pastAct-unit");
  
    /* Show Form, Hide 'Add New Activity' Button */
    switch (pastActDropdown.value) {
      case 'Walk': case 'Run': case 'Bike':
        pastActUnit.value = 'km';
        break;
      case 'Swim':
        pastActUnit.value = 'laps';
        break;
      case 'Yoga': case 'Soccer': case 'Basketball':
        pastActUnit.value = 'minutes';
        break;
      default:
        pastActUnit.value = 'units';
    }
});

// Submit past activity form
pastActSubmitBtn.addEventListener('click', function() {
    // Activity Data to Send to Server
    let data = {
        date: document.getElementById('pastAct-date').value,
        activity: document.getElementById('pastAct-activity').value.toLowerCase(),
        scalar: parseFloat(document.getElementById('pastAct-scalar').value),
        units: document.getElementById('pastAct-unit').value
    }

    if (!isValid(data)) {  
        alert("Invalid Past Activity. Please fill in the entire form.");
        return;
    }

    pastActOverlay.classList.add('hide');
    overlayBackground.classList.add('hide');

    console.log("value date = ", data.date);

    // data.date = removeTimeOfDay(new Date(data.date.replace('-','/'))).getTime();
    console.log("New date = ", data.date)

    // Add an entry in the table
    updateTable();

    console.log('Past Activity Sending:', data);

    // Post activity data to server
    fetch(`/store`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data), // post body
    })
    .then(response => response.json())
    .then(data => {
        console.log('Past Activity Success:', data);
    })
    .catch((error) => {
        console.error('Past Activity Error:', error);
    });

    // Reset form
    document.getElementById('pastAct-date').valueAsDate = newUTCDate();
    document.getElementById('pastAct-activity').value = "Walk";
    document.getElementById('pastAct-scalar').value = "";
    document.getElementById('pastAct-unit').value = "km";
});

async function createTableRows() {
    document.getElementById('no-entries').classList.add('hide');
    let entries = await getAllEntries();
    let table = document.getElementById('activities');

    for (let entry of entries) {
        let row = document.createElement('tr');
        let dateCol = document.createElement('td');
        dateCol.textContent = entry.date;
        let activityCol = document.createElement('td');
        activityCol.textContent = `${capitalize(entry.activity)} for ${entry.amount} ${entry.units}.`;
        row.appendChild(dateCol);
        row.appendChild(activityCol);
        table.appendChild(row);
    }
}

async function updateTable() {
    console.log("updating table");
    let entry = await getMostRecentEntry();
    let table = document.getElementById('activities');

    let row = document.createElement('tr');
    let dateCol = document.createElement('td');
    dateCol.textContent = entry.date;
    let activityCol = document.createElement('td');
    activityCol.textContent = `${capitalize(entry.activity)} for ${entry.amount} ${entry.units}.`;
    row.appendChild(dateCol);
    row.appendChild(activityCol);
    table.appendChild(row);
}

// Fetch the most recent entry from the database
async function getMostRecentEntry() {
    let response = await fetch('/reminder', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.json()
}

// Fetch all entries from the database
async function getAllEntries() {
    let response = await fetch('/all', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.json()
}


function isValid(data) {
    let date = new Date(data.date.replace('-','/'))
    if ( date != "Invalid Date" && date > newUTCDate()) {
      return false
    }
    if (isNaN(data.scalar) || data.scalar <= 0) {
      return false
    }
  
    return !(data.date == "" || data.activity == "" || data.units == "" )
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

/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
function removeTimeOfDay(gmtDate) {
    return new Date(gmtDate.toLocaleDateString())
}