let nav = 0;
let clicked = {};
let events = localStorage.getItem('events')
	? JSON.parse(localStorage.getItem('events')) : {};
let alarms = localStorage.getItem('alarms')
	? JSON.parse(localStorage.getItem('alarms')) : [];

const calendar = document.getElementById('calendar');
const newEventModal =  document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop =  document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventTitleInput');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let currentEventIndex = null; 
let currentDate = null;
let eventModalImageLoaded = false;

var categories = localStorage.categories != undefined ? JSON.parse(localStorage.categories) : {
    'work': '#FF0000',
    'personal': '#00FF00',
    'school': '#0000FF'
};

function openModal(monthYear, day) {
	// Create a container for this event if there isn't one already
	if (events[monthYear] == undefined) {
		events[monthYear] = {};
		events[monthYear][day] = [];
	} else if (events[monthYear][day] == undefined) {
		events[monthYear][day] = [];
	}
	clicked.events = events[monthYear][day];
	clicked.monthYear = monthYear;
	clicked.day = day;


    newEventModal.style.display = 'block';

    // Display existing events in the modal or some other part of your UI
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
        eventElement.style.backgroundColor = categories[event.category];
        eventsList.appendChild(eventElement);
    });

    backDrop.style.display = 'block';
}

function exportEvents() 
{
    // Code below references fae's (export search results)
    // const startDate = document.getElementById('sDate').value;
    // const endDate = document.getElementById('eDate').value;
    const startStr = document.getElementById('sDate').value;
    const endStr = document.getElementById('eDate').value;
    const startSegments = startStr.split("-");
    const endSegments = endStr.split("-");

    let start, end;
    // store list of events that are included in user's date range
    let eventsList = [];
    let txt = '';

    currentDate = new Date();

    if (startSegments.length != 3) 
    {
      start = {
        year: currentDate.getFullYear() - 5,
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
    } 
    else 
    {
      start = {
        year: parseInt(startSegments[0]),
        month: parseInt(startSegments[1]),
        day: parseInt(startSegments[2]),
      };
    }

    if (endSegments.length != 3) 
    {
      end = {
        year: currentDate.getFullYear() + 5,
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
    } 
    else 
    {
      end = {
        year: parseInt(endSegments[0]),
        month: parseInt(endSegments[1]),
        day: parseInt(endSegments[2]),
      };
    }
    
    // begin event iteration
    for (let year = start.year; year <= end.year; ++year) 
    {
        for (let month = 0; month <= 12; ++month) 
        { // check if before or after start month
            if (year == start.year && month < start.month)
                continue;
            // Skip if no contents
            if (year == end.year && month > end.month)
                break; 
            
            const monthEvents = events[month + "_" + year];
            
            // vvvvvvv monthEvents might be undefined vvvvvvv
            if (monthEvents == undefined) continue;
            
            for (let day = 0; day <= 31; ++day) 
            {
                // check if before or after start day
                if (year == start.year && month == start.month) if (day < start.day) continue;
                if (year == end.year && month == end.month) if (day > end.day) break;
                // Skip if no content
                if (monthEvents[day] == undefined) continue;
                
                // add info about events on current date to the txt file
                for (let i = 0; i < monthEvents[day].length; i++) 
                {   
                    txt += `Date: ${month}/${day}/${year}\nTitle: ${monthEvents[day][i].title}\nNotes: ${monthEvents[day][i].notes}\n\n`;
                }
            }
        }
    }

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

function searchEvents() {
  const searchModal = document.getElementById("searchModal");
  const closeButton = document.getElementById("closeSearchButton");
  const startDate = document.getElementById("searchStart").value;
  const endDate = document.getElementById("searchEnd").value;
  const searchQuery = document.getElementById("searchInput").value;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

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
      eventsList.forEach((event) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `${event.month}/${event.day}/${event.year}: ${event.title}`;
        eventsListElement.appendChild(listItem);
      });
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

function shareEvents() {
	const cancelButton = document.getElementById("cancelShare");
	const confirmButton = document.getElementById("confirmShare");
	const username = document.getElementById("shareUser").value;
	const startDate = document.getElementById("shareStart").value;
  	const endDate = document.getElementById("shareEnd").value;

	// Show the search results modal
	shareModal.style.display = "block";
	backDrop.style.display = "block";
	shareModal.style.opacity = 1;
	shareModal.style.visibility = "visible";

	confirmButton.onclick = () =>
	{
		fetch("/home", {
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
		}
		// Close share modal
		cancelButton.onclick = () => {
			shareModal.style.display = "none";
			backDrop.style.display = "none";
		  };
	}

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
    if (hours === 0) {
        hours = 12; // Convert "0" hours to "12"
    }

    // Ensure double digits for minutes
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes} ${period}`;
}

function processCategories()
{
    const categoryDropdown = document.getElementById('eventCat');
    categoryDropdown.addEventListener('change', function() {
        console.log("CATEGORY CHANGED");
        const chosenCat = categoryDropdown.value;
        // check if the user would like to create a custom category
        if (chosenCat === 'custom')
        {
            const newCatSection = document.getElementById('newCategory');
            newCatSection.value = '';
            newCatSection.style.display = 'block';
        }
        else
        {
            const newCatSection = document.getElementById('newCategory');
            newCatSection.style.display = 'none';
        }
    });
}

function showEditEventModal(clicked, eventIndex, event, newEvent=false) {
    const editEventModal = document.getElementById('editEventModal');
    const editEventTitleInput = document.getElementById('editEventTitleInput');
    const editNoteInput = document.getElementById('noteInput');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const updateButton = document.getElementById('updateButton');
    const imageInput = document.getElementById('image');
    
    processCategories();

    newEventModal.style.display = 'none';
    backDrop.style.display = 'block';

	// Only present delete button on editing events
	document.getElementById('deleteButton').style.visibility = newEvent
		? 'hidden' : 'visible';
 
    // Set the current event details in the input fields
    editEventTitleInput.value = event.title;
    currentEventIndex = eventIndex;
    editNoteInput.value = event.notes || '';

    // const categoryDropdown = document.getElementById('eventCat');
    // categoryDropdown.addEventListener('change', function() {
    //     const chosenCat = categoryDropdown.value;
    //     let catColor;
    //     if(categoryColors[chosenCat.toLowerCase()])
    //     {
    //         catColor = categoryColors[chosenCat.toLowerCase()];
    //     }
    //     else
    //     {
    //         catColor = document.getElementById('newCategoryColor').value;
    //     }
    // });

    // Start and end time fields with the event's times
    startTimeInput.value = event.startTime || '';
	endTimeInput.value = event.endTime || '';

	// Set the alarm-related fields
    const alarmSelect = document.getElementById('alarmTimeSelect');
	const alarmDate = document.getElementById('customAlarmDate');
	const alarmTime = document.getElementById('customAlarmTime');
	if (newEvent || event.alarm.type != 'custom') {
		alarmSelect.value = newEvent ? 'none' : event.alarm.type;

		// Hide custom event panel
        document.getElementById('alarmHeading').style.display = 'none';
        document.getElementById('customAlarmDate').style.display = 'none';
        document.getElementById('customAlarmTime').style.display = 'none';

		// Set default values for custom alarm
		const eventDate = clicked.monthYear.split('_');
		alarmDate.value = eventDate[1] + '-'
			+ (eventDate[0] < 10 ? '0' + eventDate[0] : eventDate[0]) + '-'
			+ (clicked.day < 10 ? '0' + clicked.day : clicked.day);
		alarmTime.value = '12:00';
	} else {
		// Load values for custom event panel
		alarmSelect.value = 'custom';
		const date = new Date(event.alarm.time);
		console.log(date);
		alarmDate.value = date.getFullYear() + '-'
			+ (date.getMonth() < 9 ? '0' + (date.getMonth() + 1)
				: date.getMonth() + 1)
			+ '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
		alarmTime.value =
			(date.getHours() < 10 ? '0' + date.getHours() : date.getHours())
			+ ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes()
				: date.getMinutes());
		
		// Show custom event panel
		document.getElementById('alarmHeading').style.display = 'block';
		document.getElementById('customAlarmDate').style.display = 'block';
		document.getElementById('customAlarmTime').style.display = 'block';

	}

    // set category
    const categorySelector = document.getElementById('eventCat');
    var categoryFound = false;
    
    if (event.category != undefined)
    {
        for (key in categories)
        {
            if (key.toLowerCase() == event.category.toLowerCase())
            {
                categoryFound = true;
                break;
            }
        }
    }

    categorySelector.value = categoryFound ? event.category.toLowerCase() : 'personal';

    // category colors
    const catColor = document.getElementById('categoryColor');
    
    // default color
    catColor.value = "#444444";

	// Set image inputs
	const imageSelector = document.getElementById('image');
	const imageDisplay = document.getElementById('image-display');
	if (event.image == undefined) {
		imageDisplay.style.display = 'none';
		imageSelector.value = '';
		eventModalImageLoaded = false;
	} else {
		imageDisplay.src = event.image;
		imageDisplay.style.display = 'block';
		eventModalImageLoaded = true;
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
        const eventStartTime = new Date(event.startTime); 

        let alarmType = alarmSelect.value;
        let alarmTime; 

        const updatedStartTime = startTimeInput.value; 
        const updatedEndTime = endTimeInput.value;
    
        // Determine if the custom alarm inputs should be shown or hidden
        const isCustom = alarmType === 'custom';
        document.getElementById('alarmHeading').style.display = isCustom ? 'block' : 'none';
        document.getElementById('customAlarmDate').style.display = isCustom ? 'block' : 'none';
        document.getElementById('customAlarmTime').style.display = isCustom ? 'block' : 'none';
    
        if (alarmType === 'custom') {
            const customAlarmDate = document.getElementById('customAlarmDate').value;
            const customAlarmTime = document.getElementById('customAlarmTime').value;
    
            // Check if both date and time inputs are provided
            if (customAlarmDate && customAlarmTime) {
                // Construct a full ISO string from date and time
                const isoString = `${customAlarmDate}T${customAlarmTime}:00.000`; // Adding seconds and timezone part to ensure ISO format
                alarmTime = new Date(isoString);
    
                // Check if the constructed date is valid
                if (isNaN(alarmTime.getTime())) {
                    console.error("Constructed alarmTime is invalid", isoString);
                    // Handle the invalid date case, perhaps by notifying the user or setting a default alarmTime
                    return; // Exit the function or handle this scenario appropriately
                }
            } 
        } else if (alarmType != 'none') {
            const minutesBeforeEvent = parseInt(alarmType, 10); 
            alarmTime = new Date(eventStartTime.getTime() - minutesBeforeEvent * 60000);
        }



		// Adjust alarms list
		if (alarmTime != undefined) {
			//	Move insertion index to either the index of this alarm, if it
			//	already exists, or to the end of the list
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
            category : categorySelector.value,
            notes: updatedNote,
            image: eventModalImageLoaded ? imageDisplay.src : undefined,
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

		if (now < new Date(alarm.date))
			continue;

        alert('Alarm for event: ' + events[alarm.eventMonthYear]
				[alarm.eventDay][alarm.eventIndex].title);
		alarms.splice(i, 1);
		changed = true;
	}

	if (changed)
		localStorage.setItem('alarms', JSON.stringify(alarms));
}

// Continue setting the interval as before
setInterval(checkForAlarms, 6000);

async function load(shouldSync = true) {
    const date = new Date();

    if (nav !== 0){
		date.setDate(1);
        date.setMonth(date.getMonth() + nav);
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    // Setting global date
    currentDate = date;

	//Check if this month is out of sync
	//Look into cleaning this up
    if (shouldSync) {
		// Check if should sync alarm and events
        var currentHash = new TextEncoder().encode(JSON.stringify({
			events: events[(month + 1) + '_' + year] || {},
			alarms: alarms,
            categories: categories
		}));
        currentHash = await crypto.subtle.digest('SHA-256', currentHash);
        currentHash = btoa(String.fromCharCode(...(new Uint8Array(currentHash))))
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
		/*const shareResponse = await fetch(...);
		if (shareResponse.status == 200) {
			const shareRequests = await shareResponse.json();
			for (request of shareRequests) {
				// Prompt user do you accept this
				// If yes copy and
				await fetch('shareAnswer', body {
					index: 0,
					accept: true
				});
				// else
				await fetch('shareAnswer', body {
					index: 0,
					accept: false
				});


			}
		}*/
    }



    const firstDayofMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dateString = firstDayofMonth.toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });

    const paddingDays = weekdays.indexOf(dateString.split(', ')[0]);

    document.getElementById('monthDisplay').innerText = `${date.toLocaleDateString('en-us', {month: 'long'})} ${year}`;

    calendar.innerHTML = '';

	
	monthYear = (month + 1) + '_' + year;
    for(let i = 1; i <= paddingDays + daysInMonth; i++){
        const daySquare = document.createElement('div');

        daySquare.classList.add('day');
		
        if (i > paddingDays) {
            daySquare.innerText = i - paddingDays;

            if (i - paddingDays === day && nav === 0) {
                daySquare.id = 'currentDay';
            }
        
			let eventForDay;
            if (events[monthYear] != undefined && events[monthYear][i - paddingDays] != undefined)
                eventForDay = events[monthYear][i - paddingDays];
            else
                eventForDay = [];

            eventForDay.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('event');
                eventDiv.innerText = event.title;
                eventDiv.style.backgroundColor = categories[event.category];
                if (event.startTime && event.endTime){
                    eventDiv.innerText = `${event.title} (${convertTo12HourFormat(event.startTime)} - ${convertTo12HourFormat(event.endTime)})`;
                }
                daySquare.appendChild(eventDiv);
            });

			daySquare.addEventListener('click', () => openModal(monthYear,
					i - paddingDays));
        } else {
            daySquare.classList.add('padding');
        }

        calendar.appendChild(daySquare);

        daySquare.addEventListener('click', () => {
            openModal(monthYear, i - paddingDays);
        });
    }
}


function loadEditModalImage() {
	const selector = document.getElementById('image');
	const display = document.getElementById('image-display');

	const reader = new FileReader();
	reader.onload = () => {
		display.src = reader.result;
		display.style.display = 'block';
	 	eventModalImageLoaded = true;
	};

	reader.readAsDataURL(selector.files[0]);
}


function initButtons() {
    document.getElementById('nextButton').addEventListener('click', () => {
        nav++;
        load();
    });
    
    document.getElementById('backButton').addEventListener('click', () => {
        nav--;        
        load();
    });

    document.getElementById('saveButton').addEventListener('click', addEvent);
    document.getElementById('cancelButton').addEventListener('click', closeModal);
    document.getElementById('deleteButton').addEventListener('click', deleteEvent);
    document.getElementById('closeButton').addEventListener('click', closeModal);
    document.getElementById('exportButton').addEventListener('click', exportEvents);
	document.getElementById('searchButton').addEventListener('click', searchEvents);
	document.getElementById('shareButton').addEventListener('click', shareEvents);
	document.getElementById('image').addEventListener('change', loadEditModalImage);
	document.getElementById('image-display').addEventListener('error', function() {
        const imageSelector = document.getElementById('image');
	    const imageDisplay = document.getElementById('image-display');
        imageDisplay.style.display = 'none';
		imageSelector.value = '';
		eventModalImageLoaded = false;
    });
    document.getElementById('submitCategory').addEventListener('click', function() {
        const newName = document.getElementById('newCategoryName').value.trim().toLowerCase();
        const categoryDropdown = document.getElementById('eventCat');
        const newCatSection = document.getElementById('newCategory');
        const color = document.getElementById('categoryColor');

        // check if name is in categories
        var categoryFound = false;
        for (key in categories)
        {
            console.log(key, newName);
            if (key.toLowerCase() == newName)
            {
                categoryDropdown.value = newName;
                newCatSection.style.display = 'none';
                return;
            }
        }

        // add new category to dropwdown
        if(newName)
        {
            const option = document.createElement('option');
            option.value = newName;
            option.textContent = newName;
            categoryDropdown.insertBefore(option, categoryDropdown.querySelector('option[value="custom"]'));
            categoryDropdown.value = newName;
            newCatSection.style.display = 'none';
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
    });
    
    const catDropdown = document.getElementById('eventCat');
    for (key in categories) {
        if (key == 'work' || key == 'personal' || key == 'school')
          continue;
        const option = document.createElement('option');
        option.value = key.toLowerCase();
        option.textContent = key;
        catDropdown.insertBefore(option, catDropdown.querySelector('option[value="custom"]'));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initButtons();
    load();
});
