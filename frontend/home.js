let clicked = {};
let events = localStorage.getItem('events')
    ? JSON.parse(localStorage.getItem('events')) : {};
let alarms = localStorage.getItem('alarms')
    ? JSON.parse(localStorage.getItem('alarms')) : [];
let nationalHolidays = {};
let renderNationalHolidays = localStorage.getItem('renderNationalHolidays')
    ? localStorage.getItem('renderNationalHolidays') == 'true' : true;
let savePosition = localStorage.getItem('savePosition')
    ? localStorage.getItem('savePosition') == 'true' : false;
let nav = savePosition ? isNaN(localStorage.getItem('nav')) ? 0
    : parseInt(localStorage.getItem('nav')) : 0;

const calendar = document.getElementById('calendar');
const newEventModal =  document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop =  document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventTitleInput');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let currentEventIndex = null; 
let currentDate = null;
let currentWeek = null;

let editEventModalImagePath = undefined;
let editEventModalImageContent;

var categories = localStorage.categories != undefined ? JSON.parse(localStorage.categories) : {
    'work': '#FF0000',
    'personal': '#00FF00',
    'school': '#0000FF'
};

function openModal(day) {
    // Get date info
    const currentDay = currentDate.getDay();
    const sectionDate = new Date(currentDate);
    sectionDate.setDate(currentDate.getDate() + day - currentDay)
    
    const monthYear = sectionDate.getMonth() + 1 + '_'
        + sectionDate.getFullYear();
    const date = sectionDate.getDate();


    // Create a container for this event
    if (events[monthYear] == undefined) {
        events[monthYear] = {};
        events[monthYear][date] = [];
    } else if (events[monthYear][date] == undefined) {
        events[monthYear][date] = [];
    }
    clicked.events = events[monthYear][date];
    clicked.monthYear = monthYear;
    clicked.day = date;


    newEventModal.style.display = 'block';

    // Display existing events in the modal
    const eventsList = document.getElementById('eventsList'); 
    eventsList.innerHTML = ''; 

    clicked.events.forEach((event, index) => {
        const eventElement = document.createElement('button');
        eventElement.classList.add('event-button');
        const eventText = document.createElement('p');
        eventText.innerText = event.title;
        eventElement.appendChild(eventText);
        eventElement.addEventListener('click', (e) => {
            // Prevent the openModal event
            e.stopPropagation(); 
            showEditEventModal(clicked, index, event);
        });
        eventElement.style.borderColor = categories[event.category];
        eventsList.appendChild(eventElement);
    });

    backDrop.style.display = 'block';
}

function openWeeklyEventsModal() {
    // Get date info
    const monthYear = currentWeek.getMonth() + 1 + '_'
        + currentWeek.getFullYear();
    const date = 'w' + currentWeek.getDate();


    // Create a container for this event
    if (events[monthYear] == undefined) {
        events[monthYear] = {};
        events[monthYear][date] = [];
    } else if (events[monthYear][date] == undefined) {
        events[monthYear][date] = [];
    }
    clicked.events = events[monthYear][date];
    clicked.monthYear = monthYear;
    clicked.day = date;


    newEventModal.style.display = 'block';

    // Display existing events in the modal
    const eventsList = document.getElementById('eventsList'); 
    eventsList.innerHTML = ''; 

    clicked.events.forEach((event, index) => {
        const eventElement = document.createElement('button');
        eventElement.classList.add('event-button');
        const eventText = document.createElement('p');
        eventText.innerText = event.title;
        eventElement.appendChild(eventText);
        eventElement.addEventListener('click', (e) => {
            // Prevent the openModal event
            e.stopPropagation(); 
            showEditEventModal(clicked, index, event);
        });
        eventElement.style.borderColor = categories[event.category];
        eventsList.appendChild(eventElement);
    });

    backDrop.style.display = 'block';
}

async function exportEvents() 
{
    /* Make call to export API */
	const response = await fetch("/home", {
	    method: "POST",
        headers: {
            "Content-Type": "application/json",
            session: localStorage.session,
        },
        body: JSON.stringify({
            type: "export",
            start: document.getElementById('settings-data-start').value,
            end: document.getElementById('settings-data-end').value,
            date: new Date(),
        }),
    });

    const output = await response.text();
    const txtBlob = new Blob([output], {type: 'text/plain'});

    // download url
    const url = document.createElement('a');
    url.href = URL.createObjectURL(txtBlob);
    url.download = 'MyEvents.txt';

    document.body.appendChild(url);
    url.click();

    // delete temporary link to download
    document.body.removeChild(url);
    URL.revokeObjectURL(url.href);

	document.getElementById('settings-data-widget').style.display = 'none';
	document.getElementById('settings-export-button').classList
		.remove('clicked');
}


function toggleSearchWidget() {
    const searchWidget = document.getElementById("search-widget");
    searchWidget.style.display = searchWidget.style.display == 'block'
        ? 'none' : 'block';

    document.getElementById("search-input").value = '';
}

function searchEvents() {
  const startDate = document.getElementById("search-start-date").value;
  const endDate = document.getElementById("search-end-date").value;
  const searchQuery = document.getElementById("search-input").value;

  const searchModal = document.getElementById("searchModal");
  const closeButton = document.getElementById("close-search-button");
  const exportButton = document.getElementById("export-search-button");

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  let txt = '';

  if (startDateObj > endDateObj) {
    alert("End date cannot be earlier than start date");
    return;
  }

  fetch("/home", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      session: localStorage.session,
    },
    body: JSON.stringify({
      type: "search",
      startDate: startDate,
      endDate: endDate,
      searchQuery: searchQuery,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Received search response:", data);

      const eventsList = data.events;

      // Show the search results modal
      searchModal.style.display = "block";
      backDrop.style.display = "block";
      searchModal.style.opacity = 1;
      searchModal.style.visibility = "visible";

      const eventsListElement = document.getElementById("searchResultsList");
      // Clear previous results
      eventsListElement.innerHTML = "";
      eventsList.forEach((entry) => {
        const button = document.createElement("button");
        const date = document.createElement("p");
        const title = document.createElement("p");
        const notes = document.createElement("p");

        date.innerText = `${entry.month}/${entry.day}/${entry.year}`;
        date.classList.add('search-event-button-date');
        title.innerText = entry.event.title;
        title.classList.add('search-event-button-title');
        notes.innerText = entry.event.notes;
        notes.classList.add('search-event-button-notes');

        button.appendChild(date);
        button.appendChild(title);
        button.appendChild(notes);
        button.style.borderColor = categories[entry.event.category];

        if (entry.event.imageContent != undefined) {
          const image = document.createElement("img");
          image.src = entry.event.imageContent;
          button.appendChild(image);
        }

        button.addEventListener("click", () => {
            const monthYear = entry.month+"_"+entry.year
            searchModal.style.display = "none";
            
            clicked.events = events[monthYear][entry.day];
            clicked.monthYear = monthYear;
            clicked.day = entry.day;
            showEditEventModal(clicked, entry.index, entry.event);
        });
        eventsListElement.appendChild(button);
      });

      exportButton.onclick = () => {
            eventsList.forEach((entry) => {
              txt += `Date: ${entry.month}/${entry.day}/${entry.year}\nTitle: ${entry.event.title}\nCategory: ${entry.event.category}\n`;
              if (entry.event.imagePath != undefined)
                txt += 'Image: ' + entry.event.imagePath + '\n';
              if (entry.event.notes.length != 0)
                txt += 'Notes: ' + entry.event.notes + '\n';
              txt += '\n';
            });
            const txtBlob = new Blob([txt], {type: 'text/plain'});
            // download url
            const url = document.createElement('a');
            url.href = URL.createObjectURL(txtBlob);
            url.download = 'MyEvents.txt';

            document.body.appendChild(url);
            url.click();

            // delete temporary link to download
            document.body.removeChild(url);
            URL.revokeObjectURL(url.href);
        }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

    

  // Close search results modal
  closeButton.onclick = () => {
    searchModal.style.display = "none";
    backDrop.style.display = "none";
  };
}

async function shareEvents() {
    const username = document.getElementById("settings-share-username").value;
	if (username.length == 0) {
		alert("Must provide a username");
		return;
	}

	if (!confirm("Are you sure you want to send a copy to " + username + "?"))
		return;


	const startDate = document.getElementById("settings-data-start").value;
	const endDate = document.getElementById("settings-data-end").value;
	const startDateObj = new Date(startDate);
	const endDateObj = new Date(endDate);

	if (startDateObj > endDateObj) {
		alert("End date cannot be earlier than start date");
		console.log("end date cannot be earlier");
		return;
	}

	if (startDate == "" || endDate == "")
	{
		alert("Please select a valid date range");
		console.log("invalid date range");
		return;
	}

	const response = await fetch("/share", {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		  Session: localStorage.session,
		},
		body: JSON.stringify({
		  type: "share",
		  username: username,
		  startDate: startDate,
		  endDate: endDate
		}),
	});

	if (response.status == 404) {
		alert("No user found with that username.");
	} else {
		alert("Share request to " + username +" was sent.");
		document.getElementById('settings-data-widget').style.display = 'none';
		document.getElementById('settings-share-button').classList
			.remove('clicked');
	}

}

// Below are the functions for the weekly note modal functionality
function getWeekNumber(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
}


/* Fill the nationalHolidays structure with the holidays for the provided year,
 * as specified by https://www.usa.gov/holidays */
function populateNationalHolidays(year) {
    const date = new Date();
    date.setDate(1);
    date.setFullYear(year);
    var day;

    /* New Year's Day. January 1 */
    nationalHolidays[1 + '_' + year] = {};
    nationalHolidays[1 + '_' + year][1] = "New Year's Day";

    /* Birthday of Martin Luther King, Jr. Third Monday in January */
    date.setDate(1);
    date.setMonth(0);
    nationalHolidays[1 + '_' + year][
        1 + (date.getDay() < 2 ? 1 : 8) - date.getDay() + 14
    ] = "Martin Luther King Jr. Day";

    /* Presidents Day. Third Monday in February */
    date.setDate(1);
    date.setMonth(1);
    nationalHolidays[2 + '_' + year] = {};
    nationalHolidays[2 + '_' + year][
        1 + (date.getDay() < 2 ? 1 : 8) - date.getDay() + 14
    ] = "Presidents Day";

    /* Memorial Day. Last Monday in May */
    date.setDate(1);
    date.setMonth(5);
    date.setDate(0);
    nationalHolidays[5 + '_' + year] = {};
    nationalHolidays[5 + '_' + year][
        date.getDate() + (date.getDay() > 0 ? 1 - date.getDay() : -6)
    ] = "Memorial Day";

    /* Juneteenth National Independence Day. June 19 */
    nationalHolidays[6 + '_' + year] = {};
    nationalHolidays[6 + '_' + year][19]
        = "Juneteenth National Independence Day";

    /* Independence Day. July 4 */
    nationalHolidays[7 + '_' + year] = {};
    nationalHolidays[7 + '_' + year][4] = "Independence Day";

    /* Labor Day. First Monday in September */
    date.setDate(1);
    date.setMonth(8);
    nationalHolidays[9 + '_' + year] = {};
    nationalHolidays[9 + '_' + year][
        1 + (date.getDay() < 2 ? 1 : 8) - date.getDay()
    ] = "Labor Day";

    /* Columbus Day. Second Monday in October */
    date.setDate(1);
    date.setMonth(9);
    nationalHolidays[10 + '_' + year] = {};
    nationalHolidays[10 + '_' + year][
        1 + (date.getDay() < 2 ? 1 : 8) - date.getDay() + 7
    ] = "Columbus Day";

    /* Veterans Day. November 11 */
    nationalHolidays[11 + '_' + year] = {};
    nationalHolidays[11 + '_' + year][11] = "Veterans Day";

    /* Thanksgiving Day. Fourth Thursday in November */
    date.setDate(1);
    date.setMonth(10);
    nationalHolidays[11 + '_' + year][
        1 + (date.getDay() < 5 ? 4 : 11) - date.getDay() + 21
    ] = "Thanksgiving Day";

    /* Christmas Day (December 25) */
    nationalHolidays[12 + '_' + year] = {};
    nationalHolidays[12 + '_' + year][25] = "Christmas Day";

    nationalHolidays[year] = true;
}

function loadCurrentWeekNote() {
    const today = new Date();
    const monthYear = (today.getMonth() + 1) + '_' + today.getFullYear();
    const weekId = 'w' + getWeekNumber(today);
    const events = JSON.parse(localStorage.getItem('events')) || {};
    
    if (events[monthYear] && events[monthYear][weekId] && events[monthYear][weekId].length > 0) {
        return events[monthYear][weekId][events[monthYear][weekId].length - 1].note;
    }
    return "No note for this week";
}

function getWeeklyNote() {
    const editWeeklyNoteInput = document.getElementById('weeklyNoteInput');
    const weeklyNoteModal = document.getElementById('weeklyNoteModal');
    const currentWeekNoteDisplay = document.getElementById('currentWeekNote');

    // Open the weekly note modal
    const today = new Date();
    const dateString = today.toISOString().substring(0, 10);

    weeklyNoteModal.style.display = 'block';
    weeklyNoteModal.style.opacity = 1;
    weeklyNoteModal.style.visibility = 'visible';
    backDrop.style.display = 'block';
    weekOfNote.style.display = 'block';
    weekOfNote.value = dateString;

    weekOfNote.dispatchEvent(new Event('change'));


    weekOfNote.addEventListener('change', () => {
        const datePieces = weekOfNote.value.split('-');
        const date = new Date(parseInt(datePieces[0]), parseInt(datePieces[1]) - 1, parseInt(datePieces[2]));
        const monthYear = (date.getMonth() + 1) + '_' + date.getFullYear();
        const weekNumber = getWeekNumber(date);
        const weekId = 'w' + weekNumber;
        
        // Clear existing note in input box
        editWeeklyNoteInput.value = '';

        // Load existing note if available
        if (events[monthYear] && events[monthYear][weekId] && events[monthYear][weekId].length > 0) {
            const lastEvent = events[monthYear][weekId][events[monthYear][weekId].length - 1];
            editWeeklyNoteInput.value = lastEvent.note;
        }
    });

    
    // Submit the weekly note
    document.getElementById('submitWeeklyNote').addEventListener('click', () => {
        const updatedWeeklyNote = editWeeklyNoteInput.value.trim();
        const datePieces = weekOfNote.value.split('-');
        const date = new Date(parseInt(datePieces[0]),
            parseInt(datePieces[1]) - 1, parseInt(datePieces[2]));

        const monthYear = (date.getMonth() + 1) + '_' + date.getFullYear();
        const weekNumber = getWeekNumber(date);
        const weekId = 'w' + weekNumber;

        let weeklyNote = "No note for this week";
        if (!events[monthYear]) {
            events[monthYear] = {};
            events[monthYear][weekId] = [];
        } else if (!events[monthYear][weekId]){
            events[monthYear][weekId] = [];
        }
        var weeklyHome = events[monthYear][weekId];

        // Save to local storage 
        weeklyHome.push({ note: updatedWeeklyNote });
        localStorage.setItem('events', JSON.stringify(events));
        if (getWeekNumber(currentDate) == weekNumber){
            weeklyNote = events[monthYear][weekId][0];
            console.log(weeklyNote);
            currentWeekNoteDisplay.textContent = "Current Note: " + weeklyNote;
        }
        

        // Send the note to the server
        fetch('/home', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Session': localStorage.session
            },
            body: JSON.stringify({
                'type': 'insert',
                'monthYear': monthYear,
                'day': weekId,
                'index': weeklyHome.length - 1,
                'event': weeklyHome[weeklyHome.length - 1]
            })
        })

        // Close the modal after submission
        weeklyNoteModal.style.display = 'none';
        backDrop.style.display = 'none';
    });


    // Cancel the note input and close the modal
    document.getElementById('cancelWeeklyNote').addEventListener('click', () => {
        weeklyNoteModal.style.display = 'none';
        backDrop.style.display = 'none';
    });
}


// Adding the event to the list
function addEvent() {
    if (eventTitleInput.value) {
        eventTitleInput.classList.remove('error');

        if (clicked.events.length == 0)
            showEditEventModal(clicked, 0, {title: eventTitleInput.value},
                newEvent=true);

        else
            showEditEventModal(clicked, clicked.events.length,
                {title: eventTitleInput.value}, newEvent=true);
        
        
        closeModal();
    } else {
        eventTitleInput.classList.add('error');
    }
}

// Deleting the event off the list
function deleteEvent() {
    // Adjust alarms list
    for (let i = alarms.length - 1; i > -1; --i) {
        if (alarms[i].eventMonthYear != clicked.monthYear
                || alarms[i].eventDay != clicked.day)
            continue;

        // For same day alarms, adjust other alarms event index, or
        // delete the alarm if it belonds to this event
        if (alarms[i].eventIndex > currentEventIndex)
            --alarms[i].eventIndex;
        else if (alarms[i].eventIndex == currentEventIndex)
            alarms.splice(i, 1);
    }
    localStorage.setItem('alarms', JSON.stringify(alarms));


    // Remove event
    if (clicked.events && clicked.events.length > 0) {
        clicked.events.splice(currentEventIndex, 1); 
        if (clicked.events.length === 0) {
            delete events[clicked.monthYear][clicked.day]; 
        }
        
        fetch('/home', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Session': localStorage.session
            },
            body: JSON.stringify({
                'type': 'delete',
                'monthYear': clicked.monthYear,
                'day': clicked.day,
                'index': currentEventIndex,
            })
        });
    }


    localStorage.setItem('events', JSON.stringify(events));
    closeEditModal();
}

function closeModal() {
    eventTitleInput.classList.remove('error');
    newEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    eventTitleInput.value = '';
  
    load(shouldSync = false);
}


// This converts the time so that it doesn't show in military time, but 12-hour clock time
function convertTo12HourFormat(time) {
    let [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    let period = 'AM';

    if (hours >= 12) {
        period = 'PM';
        hours = hours % 12;
    }
    // Convert "0" hours to "12"
    if (hours === 0) {
        hours = 12; 
    }

    // Ensure double digits for minutes
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes} ${period}`;
}

const alarmTime = document.getElementById('customAlarmTime');
function processCategories()
{
    const categoryDropdown = document.getElementById('eventCat');
    categoryDropdown.addEventListener('change', function() {
        const chosenCat = categoryDropdown.value;
        // check if the user would like to create a custom category
        if (chosenCat === 'custom')
        {
            const newCatSection = document.getElementById('newCategory');
            newCatSection.value = '';
            newCatSection.style.display = 'flex';
        }
        else
        {
            const newCatSection = document.getElementById('newCategory');
            newCatSection.style.display = 'none';
        }
    });
}


function loadCategories() {
    const catDropdown = document.getElementById('eventCat');
	catDropdown.innerHTML = '';
    for (key in categories) {
        const option = document.createElement('option');
        option.value = key.toLowerCase();
        option.textContent = key;
        catDropdown.appendChild(option);
    }
	const customOption = document.createElement('option');
	customOption.value = 'custom';
	customOption.textContent = 'custom';
	catDropdown.appendChild(customOption);
}

function showEditEventModal(clicked, eventIndex, event, newEvent=false) {
    const editEventModal = document.getElementById('editEventModal');
    const editEventTitleInput = document.getElementById('editEventTitleInput');
    const editNoteInput = document.getElementById('noteInput');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const updateButton = document.getElementById('updateButton');
    
    processCategories();

    newEventModal.style.display = 'none';
    backDrop.style.display = 'block';

    // Only present delete button on editing events
    document.getElementById('deleteButton').style.display = newEvent
        ? 'none' : 'inline';
 
    // Set the current event details in the input fields
    editEventTitleInput.value = event.title;
    currentEventIndex = eventIndex;
    editNoteInput.value = event.notes || '';

    // Start and end time fields with the event's times
    startTimeInput.value = event.startTime || '';
    endTimeInput.value = event.endTime || '';

    // Set the alarm-related fields
    const alarmSelect = document.getElementById('edit-event-alarm');

    const customAlarmWidget = document
            .getElementById('edit-event-custom-alarm-widget');
    const alarmTimeInput = document.
        getElementById('edit-event-custom-alarm-time');
    const alarmDateInput = document.
        getElementById('edit-event-custom-alarm-date');

    if (newEvent || event.alarm.type != 'custom') {
        alarmSelect.value = newEvent ? 'none' : event.alarm.type;

        // Hide custom event panel
        customAlarmWidget.style.display = 'none';

        // Set default values for custom alarm
        const eventDate = clicked.monthYear.split('_');
        alarmDateInput.value = eventDate[1] + '-'
            + (eventDate[0] < 10 ? '0' + eventDate[0] : eventDate[0]) + '-'
            + (clicked.day < 10 ? '0' + clicked.day : clicked.day);
        alarmTimeInput.value = '12:00';
    } else {
        // Load values for custom event panel
        alarmSelect.value = 'custom';
        const date = new Date(event.alarm.time);
        alarmDateInput.value = date.getFullYear() + '-'
            + (date.getMonth() < 9 ? '0' + (date.getMonth() + 1)
                : date.getMonth() + 1)
            + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
        alarmTimeInput.value =
            (date.getHours() < 10 ? '0' + date.getHours() : date.getHours())
            + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes()
                : date.getMinutes());
        
        // Show custom event panel
        customAlarmWidget.style.display = 'inline-block';
    }

    alarmSelect.addEventListener('change', function() {
        // Set the display of the custom alarm input fields based on the selection
        customAlarmWidget.style.display = this.value === 'custom'
            ? 'inline-block' : 'none';
    });



    // Default custom category values
    const catColor = document.getElementById('categoryColor');
    catColor.value = "#444444";
    const newCategory = document.getElementById('newCategory');

    // Load set category values
    const categorySelector = document.getElementById('eventCat');

    var categoryFound = false;
    if (event.category != undefined) {
        for (key in categories) {
            if (key.toLowerCase() == event.category.toLowerCase()) {
                categoryFound = true;
                break;
            }
        }
    }

	if (categoryFound) {
		categorySelector.value = event.category.toLowerCase();
    	newCategory.style.display = 'none';
	} else {
		const keys = Object.keys(categories);
		if (keys.length != 0) {
			categorySelector.value = keys[0];
    		newCategory.style.display = 'none';
		} else {
			categorySelector.value = 'custom';
			newCategory.style.display = 'flex';
		}
	}


    // Set image inputs
    const imageLabel = document.getElementById('edit-event-image-label');
	const imageDeleter = document.getElementById('edit-event-image-remove');
    editEventModalImagePath = event.imagePath;
    editEventModalImageContent = event.imageContent;
	if (editEventModalImagePath == undefined) {
		imageLabel.innerText = 'None';
		imageDeleter.style.display = 'none';
	} else {
		imageLabel.innerText = editEventModalImagePath;
		imageDeleter.style.display = 'inline';
	}

    // Show the edit event modal
    editEventModal.style.display = 'block';
    backDrop.style.display = 'block';
    editEventModal.style.opacity = 1;
    editEventModal.style.visibility = 'visible';

    // Handle the update button click
    updateButton.onclick = () => {
        const updatedTitle = editEventTitleInput.value.trim();
        const updatedNote = editNoteInput.value.trim();
        const updatedStartTime = startTimeInput.value; 

        let alarmType = alarmSelect.value;
        let alarmTime; 

        const updatedEndTime = endTimeInput.value;
        

        // Handle custom categories
        var categoryName = categorySelector.value;
        if (categoryName == 'custom') {
            var newName = document.getElementById('newCategoryName').value
                    .trim().toLowerCase();
            const categoryDropdown = document.getElementById('eventCat');
            const newCatSection = document.getElementById('newCategory');
            const color = document.getElementById('categoryColor');

            if (newName.length == 0 || newName == 'custom') {
				const keys = Object.keys(categories);
				newName = keys.length != 0 ? keys[0] : 'personal';
			}

            // check if name is in categories
            var unique = true;
            for (key in categories)
                if (key == newName)
                    unique = false;

            if (unique) {
                // Add option to drop down
                const option = document.createElement('option');
                option.value = newName;
                option.textContent = newName;
                categoryDropdown.insertBefore(option,
                    categoryDropdown.querySelector('option[value="custom"]'));
                categoryDropdown.value = newName;

                // Save category
                categories[newName] = color.value;
                localStorage.setItem('categories', JSON.stringify(categories));

                fetch('/home', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Session': localStorage.session
                    },
                    body: JSON.stringify({
                        'type': 'insertCategory',
                        'label': newName,
                        'color': color.value
                    })
                });
            }

        }
    
        // Determine if the custom alarm inputs should be shown or hidden
        if (alarmType === 'custom') {
            const customAlarmDate = alarmDateInput.value;
            const customAlarmTime = alarmTimeInput.value;
    
            // Check if both date and time inputs are provided
            if (customAlarmDate && customAlarmTime) {
                // Construct a full ISO string from date and time
                const isoString = `${customAlarmDate}T${customAlarmTime}:00.000`; // Adding seconds and timezone part to ensure ISO format
                alarmTime = new Date(isoString);
    
                const localISODate = `${alarmTime.getFullYear()}-${(alarmTime.getMonth() + 1).toString().padStart(2, '0')}-${alarmTime.getDate().toString().padStart(2, '0')}`;
                const localISOTime = `${alarmTime.getHours().toString().padStart(2, '0')}:${alarmTime.getMinutes().toString().padStart(2, '0')}`;
                alarmTime = `${localISODate}T${localISOTime}:00.000`;
            } 
        } else if (alarmType != 'none') {
            const today = new Date(); 
            // Split the time and convert to numbers
            const [hours, minutes] = updatedStartTime.split(':').map(Number); 

            // Create a new Date object with today's date and the specified time
            const startTimeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

            // Get the mins before event and convert to milliseconds
            const minutesBeforeEvent = parseInt(alarmType, 10); 
            const msBeforeEvent = minutesBeforeEvent * 60000; 

            // Subtract the milliseconds to get the alarm time
            alarmTime = new Date(startTimeDate.getTime() - msBeforeEvent);

            // Manually format the date to local ISO string with zero milliseconds
            const localISODate = `${alarmTime.getFullYear()}-${(alarmTime.getMonth() + 1).toString().padStart(2, '0')}-${alarmTime.getDate().toString().padStart(2, '0')}`;
            const localISOTime = `${alarmTime.getHours().toString().padStart(2, '0')}:${alarmTime.getMinutes().toString().padStart(2, '0')}`;
            alarmTime = `${localISODate}T${localISOTime}:00.000`;
        }



        // Adjust alarms list
        if (alarmTime != undefined) {
            //    Move insertion index to either the index of this alarm, if it
            //    already exists, or to the end of the list
            let index = 0;
            while (index < alarms.length
                    && (alarms[index].eventMonthYear != clicked.monthYear
                        || alarms[index].eventDay != clicked.day
                        || alarms[index].eventIndex != currentEventIndex))
                ++index;

            // Insert alarm
            alarms[index] = {
                eventMonthYear: clicked.monthYear,
                eventDay: clicked.day,
                eventIndex: currentEventIndex,
                date: alarmTime
            };
            localStorage.setItem('alarms', JSON.stringify(alarms));
        }



        // Update the event with the new alarm info
        events[clicked.monthYear][clicked.day][currentEventIndex] = {
            title: updatedTitle,
            category : categoryName,
            notes: updatedNote,
            imagePath: editEventModalImagePath,
            imageContent: editEventModalImageContent,
            startTime: updatedStartTime,
            endTime: updatedEndTime,
            alarm: {
                type: alarmType,
                time: alarmTime 
            }
        };

        // Save the updated events to localStorage
        localStorage.setItem('events', JSON.stringify(events)); 

        // Close the edit event modal and refresh the calendar
        editEventModal.style.display = 'none';
        backDrop.style.display = 'none';


        // Refresh the calendar view to reflect changes
        load(shouldSync = false); 


        // Send backend the edited event
        fetch('/home', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Session': localStorage.session
            },
            body: JSON.stringify({
                'type': 'insert',
                'monthYear': clicked.monthYear,
                'day': clicked.day,
                'index': eventIndex,
                'event': events[clicked.monthYear][clicked.day][eventIndex]
            })
        });
    };
}

function closeEditModal() {
  eventTitleInput.classList.remove("error");
  newEventModal.style.display = "none";
  editEventModal.style.display = "none";
  backDrop.style.display = "none";
  eventTitleInput.value = "";
  clicked = {};
  load((shouldSync = false));
}

function checkForAlarms() {
    const now = new Date();
    var changed = false;

    for (let i = alarms.length - 1; i > -1; --i) {
        const alarm = alarms[i];
        const alarmDate = new Date(alarm.date); // Convert string to Date object

        if (now >= alarmDate) {
            alert('Alarm for event: ' + events[alarm.eventMonthYear]
                [alarm.eventDay][alarm.eventIndex].title);
            alarms.splice(i, 1);
            changed = true;
        }
    }

    if (changed)
        localStorage.setItem('alarms', JSON.stringify(alarms));
}

// Continue setting the interval as before
setInterval(checkForAlarms, 6000);

async function load(shouldSync = true) {
    const date = new Date();

    if (nav !== 0){
        date.setDate(date.getDate() + nav * 7);
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    var monthLabel = undefined;
    switch (month) {
        case 0: monthLabel  = 'Jan'; break;
        case 1: monthLabel  = 'Feb'; break;
        case 2: monthLabel  = 'Mar'; break;
        case 3: monthLabel  = 'Apr'; break;
        case 4: monthLabel  = 'May'; break;
        case 5: monthLabel  = 'Jun'; break;
        case 6: monthLabel  = 'Jul'; break;
        case 7: monthLabel  = 'Aug'; break;
        case 8: monthLabel  = 'Spt'; break;
        case 9: monthLabel  = 'Oct'; break;
        case 10: monthLabel = 'Nov'; break;
        case 11: monthLabel = 'Dec'; break;
    }
    document.getElementById('month-text').innerText = monthLabel;
    document.getElementById('year-text').innerText = year;

    var weekStart = date.getDate();
    if (date.getDay() == 0)
        weekStart -= 6;
    else if (date.getDay() != 1)
        weekStart -= date.getDay() - 1;

    var weekDate = new Date(date);
    weekDate.setDate(weekStart);
    document.getElementById('weekly-note-label').innerText = 'Week of '
        + (weekDate.getMonth() + 1) + '/' + weekDate.getDate();
    currentWeek = weekDate;

    // Setting global date
    currentDate = date;

    //Check if this month is out of sync
    //Look into cleaning this up
    if (shouldSync) {
        // Check if should sync alarm and events
        var currentHash = '';
        if (crypto?.subtle?.digest != undefined) {
            currentHash = new TextEncoder().encode(JSON.stringify({
                events: events[(month + 1) + '_' + year] || {},
                alarms: alarms,
                categories: categories
            }));
            // Support for mobile devices without crypto.subtle
            currentHash = await crypto.subtle.digest('SHA-256', currentHash);
            currentHash =
                btoa(String.fromCharCode(...(new Uint8Array(currentHash))));
        }
        var syncResponse = await fetch('/home', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session': localStorage.session
            },
            body: JSON.stringify({
                type: 'sync',
                monthYear: (month + 1) + '_' + year,
                // Date five seconds back to avoid deleting alarms before
                // they're seen
                date: new Date(date - 5),
                hash: currentHash
            })
        });

        // Sync alarm and events
        if (syncResponse.status == 200) {
            // This month is out of sync, load the data it transferred and save it
            const syncBody = await syncResponse.json();

            alarms = syncBody.alarms;
            localStorage.setItem('alarms', JSON.stringify(alarms));

            categories = syncBody.categories;
            localStorage.setItem('categories', JSON.stringify(categories));

            events[(month + 1) + '_' + year] = syncBody.events;
            localStorage.setItem('events', JSON.stringify(events));
        }

        // Check for share requests
        const shareResponse = await fetch('/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session': localStorage.session
            },
            body: JSON.stringify({
                type: 'sharePull',
            })
        });

        if (shareResponse.status == 200)
        {
            const shareRequests = await shareResponse.json();
            for (const request of shareRequests)
            {
                if (request.events.length == 0) {
                    await fetch('/share', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'session': localStorage.session
                        },
                        body: JSON.stringify({
                            type: 'shareAnswer',
                            index: 0,
                            accept: false
                        })
                    });
                    continue;
                }
                let end = request.events.length - 1;
                const startDate = request.events[0].month + "/"
                    + (request.events[0].day[0] == 'w'
                        ? request.events[0].day.substring(1)
                        : request.events[0].day)
                    + "/" + request.events[0].year;
                const endDate = request.events[end].month + "/"
                    + (request.events[end].day[0] == 'w'
                        ? request.events[end].day.substring(1)
                        : request.events[end].day)
                    + "/" + request.events[end].year;

                const confirmation = confirm(request.username +" wants to share a copy of their events from " + startDate + " to " +
                endDate +" with you, would you like to accept it?");

                if (confirmation)
                {
                
                    await fetch('/share', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'session': localStorage.session
                        },
                        body: JSON.stringify({
                            type: 'shareAnswer',
                            index: 0,
                            accept:true

                        })
                    });
                    //alert("Share request accepted!")
                
                    for (eventInfo of request.events)
                    {
                        const mY = eventInfo.month+"_"+eventInfo.year
                        if(events[mY] == undefined)
                        {
                            events[mY] = {};
                            events[mY][eventInfo.day] = [];
                        }
                        else if (events[mY][eventInfo.day] == undefined)
                        {
                            events[mY][eventInfo.day] = [];
                        }
                        events[mY][eventInfo.day].push(eventInfo.event);
                    }
        
                    localStorage.setItem("events", JSON.stringify(events))
                }
                else
                {
                    await fetch('/share', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'session': localStorage.session
                        },
                        body: JSON.stringify({
                            type: 'shareAnswer',
                            index: 0,
                            accept:false

                        })
                    });
                }
            }
        }
    }


    /* Handle national holidays */
    if (nationalHolidays[year] == undefined && renderNationalHolidays)
        populateNationalHolidays(year);


    /* Weekly view */
    const currentDay = currentDate.getDay();
    for (let i = 0; i < 7; ++i) {
        /* Adjust header */
        const sectionDate = new Date(currentDate);
        const sectionContent = document.getElementById('day' + (i + 1));
        const sectionEventsContainer = document.querySelector('#day' + (i + 1)
            + '> .day-event-container');
        sectionEventsContainer.innerHTML = '';

        sectionDate.setDate(currentDate.getDate() + i - currentDay + 1)
        document.getElementById('day' + (i + 1) + '-date-text').innerText
            = sectionDate.getMonth() + 1 + '/' + sectionDate.getDate();
        
        if (nav == 0 && i + 1 == currentDay) {
            document.querySelector('#day' + (i + 1) + ' > .day-header')
                .classList.add('selected-cloud');
        } else {
            document.querySelector('#day' + (i + 1) + ' > .day-header')
                .classList.remove('selected-cloud');
        }

        /* Add national holidays */
        if (renderNationalHolidays) {
            const holidayTitle = nationalHolidays[sectionDate.getMonth() + 1
                + '_' + sectionDate.getFullYear()]?.[sectionDate.getDate()];
            if (holidayTitle != undefined) {
                const child = document.createElement('h2');
                child.innerText = holidayTitle;
                sectionEventsContainer.appendChild(child);
            }
        }

        /* Adjust content */
        const sectionEvents = events[sectionDate.getMonth() + 1 + '_'
                + sectionDate.getFullYear()]?.[sectionDate.getDate()];
        if (sectionEvents == undefined)
            continue;
        for (let i in sectionEvents) {
            const child = document.createElement('button');

			// Time Info
			var timeString = undefined;
			if (sectionEvents[i].startTime != ''
					&& sectionEvents[i].endTime != '') {
				timeString = sectionEvents[i].startTime + ' - '
					+ sectionEvents[i].endTime;
			} else if (sectionEvents[i].startTime != '') {
				timeString = 'Starts at ' + sectionEvents[i].startTime;
			} else if (sectionEvents[i].endTime != '') {
				timeString = 'Ends at ' + sectionEvents[i].endTime;
			}

			if (timeString != undefined) {
				const timeChild = document.createElement('p');
				timeChild.classList.add('day-event-container-time');
				timeChild.innerText = timeString;
				child.appendChild(timeChild);
			}

			// Title Info
			const titleChild = document.createElement('p');
			titleChild.innerText = sectionEvents[i].title;
            child.appendChild(titleChild);


            child.style.borderColor
              = categories[sectionEvents[i].category];

			// Image Info
            if (sectionEvents[i].imageContent != undefined) {
                const image = document.createElement('img');
                image.src = sectionEvents[i].imageContent;
                child.appendChild(image);
            }

			// Click Event
            child.onclick = () => {
              clicked.events = sectionEvents;
              clicked.monthYear = sectionDate.getMonth() + 1 + '_'
                + sectionDate.getFullYear();
              clicked.day = sectionDate.getDate();

              showEditEventModal(clicked, i, sectionEvents[i]);
            }
            sectionEventsContainer.appendChild(child);
        }
    };
}

function openSettingsMenu() {

    const settingsModal = document.getElementById('settingsModal');
    settingsModal.style.display = 'block';
	backDrop.style.display = 'block';


	// Data section
	const dataWidget = document.getElementById('settings-data-widget');
	const exportButton = document.getElementById('settings-export-button');
	const shareButton = document.getElementById('settings-share-button');
	dataWidget.style.display = 'none';
	exportButton.classList.remove('clicked');
	shareButton.classList.remove('clicked');


    // Calendar section
    document.getElementById('settings-render-holidays').checked
        = renderNationalHolidays;
    document.getElementById('settings-save-position').checked
        = savePosition;

	// Category list
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';

    for (const key in categories) {
		const element = document.createElement('div');
		const titleInput = document.createElement('input');
		const colorInput = document.createElement('input');
		const deleteButton = document.createElement('input');
		const listLength = categoriesList.childElementCount;
		
		titleInput.type = 'text';
		titleInput.placeholder = 'Name';
		titleInput.value = key;
		element.appendChild(titleInput);

		colorInput.type = 'color';
		colorInput.value = categories[key];
		element.appendChild(colorInput);

		deleteButton.type = 'button';
		deleteButton.value = 'X';
		element.appendChild(deleteButton);
		deleteButton.classList.add('no-button');

        categoriesList.appendChild(element);

		deleteButton.onclick = () => {
			categoriesList.removeChild(element);
		};
    }

	const newButton = document.createElement('input');
	newButton.type = 'button';
	newButton.value = '+';
	newButton.style.width = '24px';
	newButton.style.height = '24px';
	newButton.style.marginTop = '4px';
	newButton.classList.add('ok-button');
	newButton.onclick = settingsModalNewCategory;

	const newDiv = document.createElement('div');
	newDiv.appendChild(newButton);
	categoriesList.appendChild(newDiv);
}

function settingsShareButton() {
	const exportButton = document.getElementById('settings-export-button');
	const shareButton = document.getElementById('settings-share-button');
	const dataWidget = document.getElementById('settings-data-widget');
	const usernameField = document.getElementById('settings-share-username');

	if (shareButton.classList.contains('clicked')) {
		shareButton.classList.remove('clicked');
		dataWidget.style.display = 'none';
	} else {
		if (exportButton.classList.contains('clicked')) {
			exportButton.classList.remove('clicked');
		} else {
			dataWidget.style.display = 'block';
		}
		usernameField.style.display = 'block';
		shareButton.classList.add('clicked');
	}

}

function settingsExportButton() {
	const exportButton = document.getElementById('settings-export-button');
	const shareButton = document.getElementById('settings-share-button');
	const dataWidget = document.getElementById('settings-data-widget');
	const usernameField = document.getElementById('settings-share-username');

	if (exportButton.classList.contains('clicked')) {
		exportButton.classList.remove('clicked');
		dataWidget.style.display = 'none';
	} else {
		if (shareButton.classList.contains('clicked')) {
			shareButton.classList.remove('clicked');
		} else {
			dataWidget.style.display = 'block';
		}

		usernameField.style.display = 'none';
		exportButton.classList.add('clicked');
	}
}

function settingsDataSubmitButton() {
	const exportButton = document.getElementById('settings-export-button');
	const shareButton = document.getElementById('settings-share-button');

	if (exportButton.classList.contains('clicked')) {
		exportEvents();
	} else if (shareButton.classList.contains('clicked')) {
		shareEvents();
	}
}

function settingsModalNewCategory() {
	const categoriesList = document.getElementById('categoriesList');
	const listLength = categoriesList.childElementCount;

	const newCategorySection = document.createElement('div');
	const title = document.createElement('input');
	const color = document.createElement('input');
	const deleteButton = document.createElement('input');

	title.type = 'text';
	title.placeholder = 'Name';

	color.type = 'color';
	color.value = '#444444';
		
	deleteButton.type = 'button';
	deleteButton.value = 'X';
	deleteButton.classList.add('no-button');

	newCategorySection.appendChild(title);
	newCategorySection.appendChild(color);
	newCategorySection.appendChild(deleteButton);

	categoriesList.insertBefore(newCategorySection,
		categoriesList.childNodes[listLength - 1]);

	deleteButton.onclick = () => {
		categoriesList.removeChild(newCategorySection);
	}
}


function settingsModalDeleteCategory(index) {
	const categoriesList = document.getElementById('categoriesList');
	categoriesList.removeChild(categoriesList.childNodes[index]);
}


async function saveSettings() {
    // Calendar
    renderNationalHolidays = document
        .getElementById('settings-render-holidays').checked;
    localStorage.setItem('renderNationalHolidays',
        String(renderNationalHolidays));
    savePosition = document
        .getElementById('settings-save-position').checked;
    localStorage.setItem('savePosition', savePosition);

    // Categories
	const categoriesList = document.getElementById('categoriesList');
	const newCategories = {};
	for (let d = 0; d < categoriesList.childElementCount - 1; ++d) {
		const div = categoriesList.childNodes[d];
		const title = div.childNodes[0].value;
		const color = div.childNodes[1].value;
		if (title != '') {
			newCategories[title.toLowerCase()] = color;
		}
	}
	categories = newCategories;
	localStorage.setItem('categories', JSON.stringify(categories));

	await fetch('/home', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Session': localStorage.session
		},
		body: JSON.stringify({
			'type': 'insertCategories',
			categories: categories
		})
	});

	loadCategories();
	load();
	closeSettings();
}

function closeSettings() {
    settingsModal.style.display = 'none';
	backDrop.style.display = 'none';
}



function editModalLoadImage() {
    const selector = document.getElementById('image');
    const label = document.getElementById('edit-event-image-label');

    const reader = new FileReader();
    reader.onload = () => {
        label.innerText = selector.files[0].name;
		document.getElementById('edit-event-image-remove').style.display
			= 'inline';
        editEventModalImagePath = selector.files[0].name;
        editEventModalImageContent = reader.result;
    };

    label.innerText = 'Loading...';
    reader.readAsDataURL(selector.files[0]);
}

function editModalRemoveImage() {
	document.getElementById('edit-event-image-remove').style.display = 'none';
	document.getElementById('edit-event-image-label').innerText = 'None';
	editEventModalImagePath = undefined;
	editEventModalImageContent = undefined;
}


document.addEventListener('DOMContentLoaded', function() {
    //getWeeklyNote();
    loadCategories();
    load();
});
