'use strict'

let addFutureActBtn = document.getElementById('addFutureActivity');
let futureActOverlay = document.getElementById('futureAct-overlay');
let futureOverlayBackground = document.getElementById('future-overlay-bg');
let futureActSubmitBtn = document.getElementById('submitFutureActivity');
let futureFiltersSearch = document.getElementById('futureFilters-search');

// Set inital date as today's date
document.getElementById('futureAct-date').valueAsDate = newUTCDate();

// Set min date as today's date
// From https://stackoverflow.com/questions/32378590/set-date-input-fields-max-date-to-today
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
document.getElementById("futureDateFilter").setAttribute("min", today);
document.getElementById('futureAct-date').setAttribute("min", today);


// Open future activity overlay when add is clicked
addFutureActBtn.addEventListener('click', function() {
    futureActOverlay.classList.remove('hide');
    futureOverlayBackground.classList.remove('hide');
});

// Close overlay when close btn is clicked
document.getElementById('future-close').addEventListener('click', function() {
    futureActOverlay.classList.add('hide');
    futureOverlayBackground.classList.add('hide');
});


// On change date picker
let datepicker = document.getElementById('futureDateFilter');
futureFiltersSearch.addEventListener('click', async function() {
    // First clear the container rows
    let futureContainer = document.getElementById('future-activities');
    while (futureContainer.children.length > 2) {
        futureContainer.removeChild(futureContainer.lastChild);
    }

    if (futureContainer.childNodes.length == 1) {
        document.getElementById('future-none-found').classList.remove('hide');
    }

    if (!datepicker.value) {
        createRows();
        return;
    }

    // Hide the 'no entries' text
    document.getElementById('future-no-entries').classList.add('hide');

    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
    let entries = await getEntriesByDate(selectedDate);

    // Show/hide the none found text based on whether any entries are found
    if (entries.length == 0) {
        document.getElementById('future-none-found').classList.remove('hide');
    } else {
        document.getElementById('future-none-found').classList.add('hide');
    }
    
    // If datepicker has a value, update table with that value
    // Show only the entries whose date matches the selected date
    // Else, show all the entries
    if (datepicker.value) {
        for (let entry of entries) {
            if (entry.date == formatDate(selectedDate)) {
                updateRows(entry, futureContainer);
            }
        }
    } else {
        for (let entry of entries) {
            updateRows(entry, futureContainer);
        }
    }

    handleDeletion(futureContainer);
});

// Submit future activity form
futureActSubmitBtn.addEventListener('click', function() {
    // Activity Data to Send to Server
    let futureDatepicker = document.getElementById('futureAct-date');

    // Date is converted into SQL integer before posting to db
    let data = {
        date: (new Date(futureDatepicker.value.replace(/-/g,'/'))).getTime(),
        activity: document.getElementById('futureAct-activity').value.toLowerCase(),
        postDate: (new Date()).getTime()
    }

    if (!futureActIsValid(data)) {  
        alert("Invalid Future Activity. Please fill in the entire form.");
        return;
    }

    // Hide the overlay
    futureActOverlay.classList.add('hide');
    futureOverlayBackground.classList.add('hide');

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
        showToast('Activity added!');
    })
    .catch((error) => {
        console.error('Future Activity Error:', error);
        showToast('Error adding activity.')
    });

    // Add an entry in the table
    addRow();

    // Reset form
    document.getElementById('futureAct-date').valueAsDate = newUTCDate();
    document.getElementById('futureAct-activity').value = "Walk";
});

// Initialize all the rows with entries from db
async function createRows() {
    let entries = await getAllEntries();
    let futureContainer = document.getElementById('future-activities');

    // If there is at least one entry, remove the 'no entries' text
    if (entries.length > 0) {
        document.getElementById('future-no-entries').classList.add('hide');
        document.getElementById('future-none-found').classList.add('hide');
    }

    let datepicker = document.getElementById('futureDateFilter');
    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();

    // If datepicker has a value, show only the entries whose date matches the selected date
    // Else, show all the entries
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


// Add a new row in the container
async function addRow() {
    console.log("adding row");
    document.getElementById('future-no-entries').classList.add('hide');
    let entry = await getMostRecentEntry();
    let futureContainer = document.getElementById('future-activities');

    let datepicker = document.getElementById('futureDateFilter');
    let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();

    // If datepicker has a value: 
    // show the most recent entry from the db only if its date matches the selected date
    // Else, show the most recent entry from the db
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
    let goalDiv = document.createElement('div');
    goalDiv.className = 'goal';
    let description = document.createElement('p');
    description.textContent = `${capitalize(entry.activity)} on ${entry.date}`;
    goalDiv.appendChild(description);
    let deleteOption = document.createElement('p');
    deleteOption.className = 'reminder-option removeFutureAct';
    deleteOption.id = `${entry.postDate}`;
    deleteOption.innerHTML = '<i class="fas fa-trash-alt"></i>';
    goalDiv.appendChild(deleteOption);
    container.appendChild(goalDiv);
}

// Function to handle deleting an item from the container
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

                    // Remove the deleted entry's row from the container
                    if (container.contains(deletedNode)) {
                        container.removeChild(deletedNode);
                    } 
                    if (container.children.length == 2) {
                        if (datepicker.value) {
                            document.getElementById('future-none-found').classList.remove('hide');
                            document.getElementById('future-no-entries').classList.add('hide');
                        } else {
                            document.getElementById('future-no-entries').classList.remove('hide');
                            document.getElementById('future-none-found').classList.add('hide');
                        }
                        
                    }
                    showToast('Activity deleted!');
                })
                .catch((error) => {
                    console.error('Future Activity Deletion Error:', error);
                    showToast('Error deleting activity.')
                });
            });
        });
    }
}


// Fetch the most recent entry from the database
async function getMostRecentEntry() {
    let response = await fetch('/recentfuture', {
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

// Fetch all future entries from the database
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
    // let date = new Date(data.date.replace('-','/'))
    // if ( date != "Invalid Date" && date < newUTCDate()) {
    //   return false
    // }
  
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

// Opens toast
function showToast(message) {
    var toast = document.getElementById('future-toast');
    toast.className = 'show';
    toast.textContent = message;
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 2000);
}