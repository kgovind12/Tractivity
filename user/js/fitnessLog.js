'use strict'

// Activity to difficulty level map
let difficultyMap = {
    walk: {
        "easy": 1,
        "hard": 2
    },
    run: {
        "easy": 0.5,
        "hard": 2
    },
    swim: {
        "easy": 5,
        "hard": 15
    },
    bike: {
        "easy": 3,
        "hard": 6
    },
    yoga: {
        "easy": 30,
        "hard": 60
    },
    soccer: {
        "easy": 30,
        "hard": 60
    },
    basketball: {
        "easy": 30,
        "hard": 60
    },
}

// Difficulty level to color map
var difficultyColorMap = {
    "easy": "green",
    "medium": "yellow",
    "hard": "red"
}

// Variables
let addPastActBtn = document.getElementById("addPastActivity");
let pastActOverlay = document.getElementById('pastAct-overlay');
let overlayBackground = document.getElementById('overlay-bg');

let pastActSubmitBtn = document.getElementById('submitPastActivity');
let pastActDropdown = document.getElementById('pastAct-activity');
let pastFilterSearch = document.getElementById('pastFilters-search');

/* Set default date in forms to current date */
document.getElementById('pastAct-date').valueAsDate = newUTCDate()

// Set max date as today's date
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
document.getElementById("pastDateFilter").setAttribute("max", today);
document.getElementById('pastAct-date').setAttribute("max", today);

// Open the past activity overlay when Add is clicked
addPastActBtn.addEventListener("click", function() {
    pastActOverlay.classList.remove('hide');
    overlayBackground.classList.remove('hide');
});

// Hide overlay on close
document.getElementById('close').addEventListener('click', function() {
    pastActOverlay.classList.add('hide');
    overlayBackground.classList.add('hide');
});

// When search button is clicked
let datepicker = document.getElementById('pastDateFilter');
let difficultyFilter = document.getElementById('pastDifficultyFilter');

pastFilterSearch.addEventListener('click', async function() {
    let selectedDate = "";

    if (datepicker.value) {
        selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
    }
    let selectedDifficulty = difficultyFilter.value;

    if (selectedDate == "" && selectedDifficulty == "") {
        createTableRows();
        return;
    }

    let entries = await getFilteredEntries(selectedDate, selectedDifficulty);

    // Show/hide none found text
    if (entries.length == 0) {
        document.getElementById('none-found').classList.remove('hide');
    } else {
        document.getElementById('none-found').classList.add('hide');
    }

    // Clear the table's current rows
    let table = document.getElementById('activities');
    while (table.children.length > 1) {
        table.removeChild(table.lastChild);
    }

    if (table.childNodes.length == 1) {
        document.getElementById('none-found').classList.remove('hide');
    }

    for (let entry of entries) {
        updateTable(entry, table);
    }

    handleDeletion(table);
});

pastActDropdown.addEventListener('change', function() {
    let pastActUnit = document.getElementById("pastAct-unit");
  
    // Set units field based on which activity is selected
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
    let pastDatepicker = document.getElementById('pastAct-date');
    // Activity Data to Send to Server
    let activity = document.getElementById('pastAct-activity').value.toLowerCase();
    let scalar = parseFloat(document.getElementById('pastAct-scalar').value);

    let data = {
        date: (new Date(pastDatepicker.value.replace(/-/g,'/'))).getTime(),
        activity: document.getElementById('pastAct-activity').value.toLowerCase(),
        scalar: parseFloat(document.getElementById('pastAct-scalar').value),
        units: document.getElementById('pastAct-unit').value,
        postDate: (new Date()).getTime(),
        difficulty: calculateDifficulty(activity, scalar)
    }

    if (!isValid(data)) {  
        alert("Invalid Past Activity. Please fill in the entire form.");
        return;
    }

    // Hide the overlay
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

// Given the type of activity and the number of units completed, determine the difficulty level
function calculateDifficulty(activity, scalar) {
    let activityMap = difficultyMap[activity];
    let difficulty = "";

    if (scalar <= activityMap[Object.keys(activityMap)[0]]) {
        difficulty = "easy";
    } else if (scalar >= activityMap[Object.keys(activityMap)[1]]) {
        difficulty = "hard";
    } else {
        difficulty = "medium";
    }

    return difficulty;
}

// Function to display the table initally on page load
async function createTableRows() {
    let entries = await getAllEntries();
    let table = document.getElementById('activities');

    // If there is at least one entry, remove the 'no entries' text
    if (entries.length > 0) {
        document.getElementById('no-entries').classList.add('hide');
        document.getElementById('none-found').classList.add('hide');
    }

    for (let entry of entries) {
        updateTable(entry, table);
    }

    handleDeletion(table);
}

// Function to add a row to the table
async function addEntry() {
    document.getElementById('no-entries').classList.add('hide');
    let entry = await getMostRecentEntry();
    let table = document.getElementById('activities');

    let datepicker = document.getElementById('pastDateFilter');
    let difficultyFilter = document.getElementById('pastDifficultyFilter');

    // If date and difficulty are both selected
    if (datepicker.value && difficultyFilter.value != "") {
        let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();
        let selectedDifficulty = difficultyFilter.value;

        if (entry.date == formatDate(selectedDate) && entry.difficulty == selectedDifficulty) {
            document.getElementById('none-found').classList.add('hide');
            updateTable(entry, table);
        }
    } else if (datepicker.value) { // if only date is selected
        let selectedDate = (new Date(datepicker.value.replace(/-/g,'/'))).getTime();

        if (entry.date == formatDate(selectedDate)) {
            document.getElementById('none-found').classList.add('hide');
            updateTable(entry, table);
        }
    } else { // if only difficulty is selected
        if (entry.difficulty == selectedDifficulty) {
            document.getElementById('none-found').classList.add('hide');
            updateTable(entry, table);
        }
    }

    // Check if table is empty, then display the 'none found' text
    if (table.children.length <= 1) {
        document.getElementById('none-found').classList.remove('hide');
    }
    
    handleDeletion(table);
}

// Function to update the table rows
function updateTable(entry, table) {
    console.log("updating table");
    if (entry.amount != -1 && entry.units != -1) {
        let row = document.createElement('tr');
        let dateCol = document.createElement('td');
        dateCol.textContent = entry.date;

        let activityCol = document.createElement('td');
        activityCol.textContent = `${capitalize(entry.activity)} for ${entry.amount} ${entry.units}`;

        let difficultyCol = document.createElement('td');
        difficultyCol.innerHTML = `<i class="fas fa-circle tooltip"><span class="tooltiptext">${entry.difficulty}</span></i>`;
        difficultyCol.className = `difficulty ${difficultyColorMap[entry.difficulty]}`;

        let deleteCol = document.createElement('td');
        deleteCol.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteCol.className = 'reminder-option removePastAct';
        deleteCol.id = `${entry.postDate}`;

        row.appendChild(dateCol);
        row.appendChild(activityCol);
        row.appendChild(difficultyCol);
        row.appendChild(deleteCol);

        table.appendChild(row);
    }
}

// Function to handle deleting an entry. 
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

                    // Update table - remove deleted entry
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

// Fetch entries with selected date and difficulty
async function getFilteredEntries(date, difficulty) {
    let endpoint = `/filteredpast?date=${date}&difficulty=${difficulty}`;

    let response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    return response.json();
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

// Fetch all past entries from the database
async function getAllEntries() {
    let response = await fetch('/allpast', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return response.json()
}

// Check if the data entered by the user is valid
function isValid(data) {
    // let date = new Date(data.date.replace('-','/'))
    // if ( date != "Invalid Date" && date > newUTCDate()) {
    //   return false
    // }
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