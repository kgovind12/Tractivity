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


// On change date picker
let datepicker = document.getElementById('futureDateFilter');
datepicker.addEventListener('change', async function() {
    if (!datepicker.value) {
        createRows();
        return;
    }

    // Hide the 'no entries' text
    document.getElementById('future-no-entries').classList.add('hide');

    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
    let entries = await getEntriesByDate(selectedDate);

    if (entries.length == 0) {
        document.getElementById('future-none-found').classList.remove('hide');
    } else {
        document.getElementById('future-none-found').classList.add('hide');
    }

    let futureContainer = document.getElementById('future-activities');
    while (futureContainer.children.length > 2) {
        futureContainer.removeChild(futureContainer.lastChild);
    }

    if (futureContainer.childNodes.length == 1) {
        document.getElementById('future-none-found').classList.remove('hide');
    }
    
    if (datepicker.value) {
        for (let entry of entries) {
            if (entry.date == formatDate(selectedDate)) {
                updateRows(entry, futureContainer);
            }
        }
    } else {
        updateRows(entry, futureContainer);
    }

    handleDeletion(futureContainer);
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

    // If there is at least one entry, remove the 'no entries' text
    if (entries.length > 0) {
        document.getElementById('future-no-entries').classList.add('hide');
        document.getElementById('future-none-found').classList.add('hide');
    }

    let datepicker = document.getElementById('futureDateFilter');
    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();

    if (datepicker.value) {
        for (let entry of entries) {
            if (entry.date == formatDate(selectedDate)) {
                document.getElementById('future-none-found').classList.add('hide');
                updateRows(entry, futureContainer);
            } else {
                if (futureContainer.children.length <= 2) {
                    document.getElementById('future-none-found').classList.remove('hide');
                } 
            }
        }
    } else {
        for (let entry of entries) {
            updateRows(entry, futureContainer);
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

    let datepicker = document.getElementById('futureDateFilter');
    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
    if (datepicker.value) {
        if (entry.date == formatDate(selectedDate)) {
            document.getElementById('future-none-found').classList.add('hide');
            updateRows(entry, futureContainer);
        } else {
            if (futureContainer.children.length <= 2) {
                document.getElementById('future-none-found').classList.remove('hide');
            } 
        }
    } else {
        document.getElementById('future-none-found').classList.add('hide');
        updateRows(entry, futureContainer);
    }

    handleDeletion(futureContainer);
}

// Function to update the rows in the container
function updateRows(entry, container) {
    console.log("updating rows");
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
        container.appendChild(goalDiv);
    }
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
                    if (container.children.length == 2) {
                        document.getElementById('future-no-entries').classList.remove('hide');
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

// Fetch entries with specific date from the database
async function getEntriesByDate(date) {
    let endpoint = `/bydatefuture?date=${date}`;

    let response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    });
    
    return response.json()
}

// Fetch all entries from the database
async function getAllEntries() {
    let response = await fetch('/allfuture', {
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

// Convert from Unix time to JavaScript DateTime
function formatDate(timestamp) {
    const dateObject = new Date(timestamp)
    const dateTime = dateObject.toLocaleString();
    return dateTime.split(',')[0];
}