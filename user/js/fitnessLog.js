'use strict'

/* Show add past activity overlay */
let addPastActBtn = document.getElementById("addPastActivity");
let pastActOverlay = document.getElementById('pastAct-overlay');
let overlayBackground = document.getElementById('overlay-bg');

let pastActSubmitBtn = document.getElementById('submitPastActivity');
let pastActDropdown = document.getElementById('pastAct-activity');

/* Set default date in forms to current date */
document.getElementById('pastAct-date').valueAsDate = newUTCDate()

// Set min date as today's date
let today = new Date();
let dd = today.getDate();
let mm = today.getMonth() + 1;
let yyyy = today.getFullYear();

if (dd < 10) {
   dd = '0' + dd;
}

if (mm < 10) {
   mm = '0' + mm;
} 
    
today = yyyy + '-' + mm + '-' + dd;
document.getElementById("pastDateFilter").setAttribute("max", today);

addPastActBtn.addEventListener("click", function() {
    pastActOverlay.classList.remove('hide');
    overlayBackground.classList.remove('hide');
});

document.getElementById('close').addEventListener('click', function() {
    pastActOverlay.classList.add('hide');
    overlayBackground.classList.add('hide');
});


// On change date picker
let datepicker = document.getElementById('pastDateFilter');
datepicker.addEventListener('change', async function() {
    if (!datepicker.value) { // if datepicker is cleared
        createTableRows();
        return;
    }

    // Hide the 'no entries' text
    document.getElementById('no-entries').classList.add('hide');

    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
    let entries = await getEntriesByDate(selectedDate);

    if (entries.length == 0) {
        document.getElementById('none-found').classList.remove('hide');
    } else {
        document.getElementById('none-found').classList.add('hide');
    }

    let table = document.getElementById('activities');
    while (table.children.length > 1) {
        table.removeChild(table.lastChild);
    }

    if (table.childNodes.length == 1) {
        document.getElementById('none-found').classList.remove('hide');
    }
    
    if (datepicker.value) {
        for (let entry of entries) {
            if (entry.date == formatDate(selectedDate)) {
                updateTable(entry, table);
            }
        }
    } else {
        updateTable(entry, table);
    }

    handleDeletion(table);
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
        units: document.getElementById('pastAct-unit').value,
        postDate: (new Date()).getTime()
    }

    if (!isValid(data)) {  
        alert("Invalid Past Activity. Please fill in the entire form.");
        return;
    }

    pastActOverlay.classList.add('hide');
    overlayBackground.classList.add('hide');

    // Add an entry in the table
    addEntry();

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
        showToast('Activity added!');
    })
    .catch((error) => {
        console.error('Past Activity Error:', error);
        showToast('Error adding activity.');
    });

    // Reset form
    document.getElementById('pastAct-date').valueAsDate = newUTCDate();
    document.getElementById('pastAct-activity').value = "Walk";
    document.getElementById('pastAct-scalar').value = "";
    document.getElementById('pastAct-unit').value = "km";
});

async function createTableRows() {
    let entries = await getAllEntries();
    let table = document.getElementById('activities');

    // If there is at least one entry, remove the 'no entries' text
    if (entries.length > 0) {
        document.getElementById('no-entries').classList.add('hide');
        document.getElementById('none-found').classList.add('hide');
    }

    let datepicker = document.getElementById('pastDateFilter');
    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();

    if (datepicker.value) {
        for (let entry of entries) {
            if (entry.date == formatDate(selectedDate)) {
                document.getElementById('none-found').classList.add('hide');
                updateTable(entry, table);
            } else {
                if (table.children.length <= 1) {
                    document.getElementById('none-found').classList.remove('hide');
                } 
            }
        }
    } else {
        for (let entry of entries) {
            updateTable(entry, table);
        }
    }

    handleDeletion(table);
}

async function addEntry() {
    document.getElementById('no-entries').classList.add('hide');
    let entry = await getMostRecentEntry();
    let table = document.getElementById('activities');

    let datepicker = document.getElementById('pastDateFilter');
    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
    if (datepicker.value) {
        if (entry.date == formatDate(selectedDate)) {
            document.getElementById('none-found').classList.add('hide');
            updateTable(entry, table);
        } else {
            if (table.children.length <= 1) {
                document.getElementById('none-found').classList.remove('hide');
            } 
        }
    } else {
        document.getElementById('none-found').classList.add('hide');
        updateTable(entry, table);
    }
    
    handleDeletion(table);
}

function updateTable(entry, table) {
    console.log("updating table");
    if (entry.amount != -1 && entry.units != -1) {
        let row = document.createElement('tr');
        let dateCol = document.createElement('td');
        dateCol.textContent = entry.date;
        let activityCol = document.createElement('td');
        activityCol.textContent = `${capitalize(entry.activity)} for ${entry.amount} ${entry.units}`;
        let deleteCol = document.createElement('td');
        deleteCol.textContent = 'Remove';
        deleteCol.className = 'reminder-option removePastAct';
        deleteCol.id = `${entry.postDate}`;
        row.appendChild(dateCol);
        row.appendChild(activityCol);
        row.appendChild(deleteCol);
        table.appendChild(row);
    }
}

function handleDeletion(container) {
    const removeBtns = document.querySelectorAll('.removePastAct');

    if (removeBtns.length > 0) {
        removeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                let data = {
                    postDate: btn.id
                }
        
                console.log('Past Activity Deleting:', data);

                let deletedRow = document.getElementById(data.postDate).parentElement;
        
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
                    console.log('Past Activity Deleted Successfully:', data);
                    showToast('Activity Deleted!');
                    if (container.contains(deletedRow)) {
                        container.removeChild(deletedRow);
                    } 
                    if (container.children.length == 1) {
                        document.getElementById('no-entries').classList.remove('hide');
                    }
                })
                .catch((error) => {
                    console.error('Past Activity Deletion Error:', error);
                    showToast('Error deleting activity.');
                });
            });
        });
    }
}

// Fetch the most recent entry from the database
async function getMostRecentEntry() {
    let response = await fetch('/recentpast', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.json()
}

// Fetch entries with specific date from the database
async function getEntriesByDate(date) {
    let endpoint = `/bydatepast?date=${date}`;

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
    let response = await fetch('/allpast', {
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

// Convert from Unix time to JavaScript DateTime
function formatDate(timestamp) {
    const dateObject = new Date(timestamp)
    const dateTime = dateObject.toLocaleString();
    return dateTime.split(',')[0];
}

// Opens toast
function showToast(message) {
    var toast = document.getElementById('toast');
    toast.className = 'show';
    toast.textContent = message;
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 2000);
}