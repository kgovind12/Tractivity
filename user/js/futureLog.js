'use strict'

let addFutureActBtn = document.getElementById('addFutureActivity');
let futureActOverlay = document.getElementById('futureAct-overlay');
let futureOverlayBackground = document.getElementById('future-overlay-bg');
let futureActSubmitBtn = document.getElementById('submitFutureActivity');

// Set inital date as today's date
document.getElementById('futureAct-date').valueAsDate = newUTCDate();

addFutureActBtn.addEventListener('click', function() {
    console.log("open pressed");
    futureActOverlay.classList.remove('hide');
    futureOverlayBackground.classList.remove('hide');
});

document.getElementById('future-close').addEventListener('click', function() {
    futureActOverlay.classList.add('hide');
    futureOverlayBackground.classList.add('hide');
});

// Submit future activity form
futureActSubmitBtn.addEventListener('click', function() {
    // Activity Data to Send to Server
    let data = {
        date: document.getElementById('futureAct-date').value,
        activity: document.getElementById('futureAct-activity').value.toLowerCase(),
    }

    if (!futureActIsValid(data)) {  
        alert("Invalid Past Activity. Please fill in the entire form.");
        return;
    }

    futureActOverlay.classList.add('hide');
    futureOverlayBackground.classList.add('hide');

    // Add an entry in the table
    updateTable();

    console.log('Future Activity Sending:', data);

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
        console.log('Future Activity Success:', data);
    })
    .catch((error) => {
        console.error('Future Activity Error:', error);
    });

    // Reset form
    document.getElementById('futureAct-date').valueAsDate = newUTCDate();
    document.getElementById('futureAct-activity').value = "Walk";
});

function futureActIsValid(data) {
    console.log("data = ", data);
    let date = new Date(data.date.replace('-','/'))
    if ( date != "Invalid Date" && date < newUTCDate()) {
      return false
    }
  
    return !(data.date == "" || data.activity == "")
}

async function createTableRows() {
    document.getElementById('future-no-entries').classList.add('hide');
    let entries = await getAllEntries();
    let table = document.getElementById('future-activities');

    for (let entry of entries) {
        if (entry.amount == -1 && entry.units == -1) {
            let row = document.createElement('tr');
            let dateCol = document.createElement('td');
            dateCol.textContent = entry.date;
            let activityCol = document.createElement('td');
            activityCol.textContent = `${capitalize(entry.activity)}`;
            row.appendChild(dateCol);
            row.appendChild(activityCol);
            table.appendChild(row);
        }
    }
}

async function updateTable() {
    console.log("updating future table");
    document.getElementById('future-no-entries').classList.add('hide');
    let entry = await getMostRecentEntry();
    let table = document.getElementById('future-activities');
    console.log("Entry = ", entry);

    // First checking if it is a future plan
    if (entry.amount == -1 && entry.units == -1) {
        let row = document.createElement('tr');
        let dateCol = document.createElement('td');
        dateCol.textContent = entry.date;
        let activityCol = document.createElement('td');
        activityCol.textContent = `${capitalize(entry.activity)}`;
        row.appendChild(dateCol);
        row.appendChild(activityCol);
        table.appendChild(row);
    }
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