'use strict'

let addFutureActBtn = document.getElementById('addFutureActivity');
let futureActOverlay = document.getElementById('futureAct-overlay');
let futureOverlayBackground = document.getElementById('future-overlay-bg');
let futureActSubmitBtn = document.getElementById('submitFutureActivity');

// Set inital date as today's date
document.getElementById('futureAct-date').valueAsDate = newUTCDate();

addFutureActBtn.addEventListener('click', function() {
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
        postDate: (new Date()).getTime()
    }

    if (!futureActIsValid(data)) {  
        alert("Invalid Future Activity. Please fill in the entire form.");
        return;
    }

    futureActOverlay.classList.add('hide');
    futureOverlayBackground.classList.add('hide');

    // Add an entry in the table
    addRow();

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

// Initialize all the rows with entries from db
async function createRows() {
    let entries = await getAllEntries();
    let futureContainer = document.getElementById('future-activities');
    console.log("Entries = ", entries);

    // if (entries.length > 0) {
    //     console.log("many entries")
    //     document.getElementById('future-no-entries').classList.add('hide');
    // }

    for (let entry of entries) {
        if (entry.amount == -1 && entry.units == -1) {
            document.getElementById('future-no-entries').classList.add('hide');
            let goalDiv = document.createElement('div');
            goalDiv.className = 'goal';
            let description = document.createElement('p');
            description.textContent = `${capitalize(entry.activity)} on ${entry.date}`;
            goalDiv.appendChild(description);
            let deleteOption = document.createElement('p');
            deleteOption.className = 'reminder-option removeFutureAct';
            deleteOption.id = `${entry.postDate}`;
            deleteOption.textContent = 'Remove';
            goalDiv.appendChild(deleteOption);
            futureContainer.appendChild(goalDiv);
        }
    }

    handleDeletion(futureContainer);
}


// Add a new row
async function addRow() {
    console.log("adding row");
    document.getElementById('future-no-entries').classList.add('hide');
    let entry = await getMostRecentEntry();
    let futureContainer = document.getElementById('future-activities');

    // First checking if it is a future plan
    if (entry.amount == -1 && entry.units == -1) {
        let goalDiv = document.createElement('div');
        goalDiv.className = 'goal';
        let description = document.createElement('p');
        description.textContent = `${capitalize(entry.activity)} on ${entry.date}`;
        goalDiv.appendChild(description);
        let deleteOption = document.createElement('p');
        deleteOption.className = 'reminder-option removeFutureAct';
        deleteOption.id = `${entry.postDate}`;
        deleteOption.textContent = 'Remove';
        goalDiv.appendChild(deleteOption);
        futureContainer.appendChild(goalDiv);
    }

    handleDeletion(futureContainer);
}


function handleDeletion(container) {
    const removeBtns = document.querySelectorAll('.removeFutureAct');

    if (removeBtns.length > 0) {
        removeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                let data = {
                    postDate: btn.id
                }
        
                console.log('Future Activity Deleting:', data);

                let deletedNode = document.getElementById(data.postDate).parentElement;
        
                // Post activity data to server
                fetch(`/delete`, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data), // post body
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Future Activity Deleted Successfully:', data);
                    if (container.contains(deletedNode)) {
                        container.removeChild(deletedNode);
                    } 
                })
                .catch((error) => {
                    console.error('Future Activity Deletion Error:', error);
                });
            });
        });
    }
}


// Fetch the most recent entry from the database
async function getMostRecentEntry() {
    let response = await fetch('/recent', {
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

// Checks if future form is valid
function futureActIsValid(data) {
    let date = new Date(data.date.replace('-','/'))
    if ( date != "Invalid Date" && date < newUTCDate()) {
      return false
    }
  
    return !(data.date == "" || data.activity == "")
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