let nav = 0;
let clicked = {};
let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : {};

const calendar = document.getElementById('calendar');
const newEventModal =  document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop =  document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventTitleInput');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let currentEventIndex = null; 
let currentDate = null;

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
        eventElement.innerText = event.title;
        eventElement.addEventListener('click', (e) => {
            // Prevent the openModal event
            e.stopPropagation(); 
            showEditEventModal(clicked, index, event);
        });
        eventsList.appendChild(eventElement);
    });

    backDrop.style.display = 'block';
}

function saveEvent() {
    if (eventTitleInput.value) {
        eventTitleInput.classList.remove('error');

        clicked.events.push({
            title: eventTitleInput.value
        });

        localStorage.setItem('events', JSON.stringify(events));

        const eventIndex = clicked.events.length - 1;
        showEditEventModal(clicked, eventIndex, clicked.events[eventIndex]);
        closeModal();
    } else {
        eventTitleInput.classList.add('error');
    }
}

function deleteEvent(day, eventIndex) {
    // Modify this function to remove a specific event
    // eventIndex is the index of the event to be removed
    if (clicked.events && clicked.events.length > 0) {
        clicked.events.splice(eventIndex, 1); 
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
				'index': eventIndex,
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
  
    load();
}










function showEditEventModal(clicked, eventIndex, event) {
    const editEventModal = document.getElementById('editEventModal');
    const editEventTitleInput = document.getElementById('editEventTitleInput');
    const editNoteInput = document.getElementById('noteInput');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const updateButton = document.getElementById('updateButton');

    newEventModal.style.display = 'none';
    backDrop.style.display = 'block';

 
    // Set the current event details in the input fields
    editEventTitleInput.value = event.title;
    currentEventIndex = eventIndex;
    editNoteInput.value = event.notes || '';

    // Here, set the start and end time fields with the event's times
    startTimeInput.value = event.startTime || ''; 
    endTimeInput.value = event.endTime || '';


    // Show the edit event modal
    editEventModal.style.display = 'block';
    backDrop.style.display = 'block';
    editEventModal.style.opacity = 1;
    editEventModal.style.visibility = 'visible';

    // Handle the update button click
    updateButton.onclick = () => {
        const updatedTitle = editEventTitleInput.value.trim();
        const updatedNote = editNoteInput.value.trim(); // Get the updated note text
        const updatedStartTime = startTimeInput.value;
        const updatedEndTime = endTimeInput.value;
    

    
        // Overwrite the existing note with the new note
		event.title = updatedTitle;
		event.notes = updatedNote;
		event.startTime = updatedStartTime;
		event.endTime = updatedEndTime;
    
        localStorage.setItem('events', JSON.stringify(events)); // Save the updated events to localStorage

        // Close the edit event modal and refresh the calendar
        editEventModal.style.display = 'none';
        backDrop.style.display = 'none';
        // Refresh the calendar view to reflect changes
        load(); 


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
				'event': event
			})
		});
    };
}

function closeEditModal() {
    eventTitleInput.classList.remove('error');
    newEventModal.style.display = 'none';
    editEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    eventTitleInput.value = '';
    clicked = {};
    load();
}









async function load() {
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

	
	// Check if this month is out of sync
	// Look into cleaning this up
	var currentHash = new TextEncoder().encode(JSON.stringify(
		events[(month + 1) + '_' + year] || {}));
	currentHash = await crypto.subtle.digest('SHA-256', currentHash);
	currentHash = btoa(String.fromCharCode(...(new Uint8Array(currentHash))))
	const syncResponse = await fetch('/home', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'session': localStorage.session
		},
		body: JSON.stringify({
			type: 'sync',
			monthYear: (month + 1) + '_' + year,
			hash: currentHash
		})
	});
	if (syncResponse.status == 200) {
		// This month is out of sync, load the data it transferred and save it
		events[(month + 1) + '_' + year] = await syncResponse.json();
        localStorage.setItem('events', JSON.stringify(events));
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
        
			let eventForDay = [];
			if (events[monthYear] != undefined && events[monthYear][i - paddingDays] != undefined)
				eventForDay = events[monthYear][i - paddingDays];
			eventForDay.forEach(event => {
				const eventDiv = document.createElement('div');
				eventDiv.classList.add('event');
				eventDiv.innerText = event.title;
				if (event.startTime && event.endTime){
					eventDiv.innerText = `${event.title} (${event.startTime} - ${event.endTime})`;
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

function initButtons() {
    document.getElementById('nextButton').addEventListener('click', () => {
        nav++;
        load();
    });
    
    document.getElementById('backButton').addEventListener('click', () => {
        nav--;        
        load();
    });

    document.getElementById('saveButton').addEventListener('click', saveEvent);
    document.getElementById('cancelButton').addEventListener('click', closeModal);
    document.getElementById('deleteButton').addEventListener('click', deleteEvent);
    document.getElementById('closeButton').addEventListener('click', closeModal);

}

document.addEventListener('DOMContentLoaded', function() {
    initButtons();
    load();
});


