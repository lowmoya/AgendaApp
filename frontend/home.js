let nav = 0;
let clicked = null;
let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : {};

const calendar = document.getElementById('calendar');
const newEventModal =  document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop =  document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventTitleInput');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let currentEventIndex = null; 
let currentDate = null;

function openModal(date) {
    clicked = date;
    const eventsForDay = events[clicked] || [];
    newEventModal.style.display = 'block';

    // Display existing events in the modal or some other part of your UI
    const eventsList = document.getElementById('eventsList'); 
    eventsList.innerHTML = ''; 

    eventsForDay.forEach((event, index) => {
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

function showEditEventModal(day, eventIndex, event) {
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
    editNoteInput.value = event.notes;

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
        if (events[day] && events[day][eventIndex]) {
            events[day][eventIndex].title = updatedTitle;
            events[day][eventIndex].notes = updatedNote;
            events[day][eventIndex].startTime = updatedStartTime;
            events[day][eventIndex].endTime = updatedEndTime;
        }
    
        localStorage.setItem('events', JSON.stringify(events));
    

        // Close the edit event modal and refresh the calendar
        editEventModal.style.display = 'none';
        backDrop.style.display = 'none';
        // Refresh the calendar view to reflect changes
        load(); 
    };
}

function editEvent(day, eventIndex, event) {
    // Pre-fill the event details in the modal
    eventTitleInput.value = event.title; 

    // Display the modal for editing
    newEventModal.style.display = 'block';


    // Temporarily remove the default save button event listener
    const saveButtonOriginal = document.getElementById('saveButton').cloneNode(true);
    document.getElementById('saveButton').replaceWith(saveButtonOriginal);

    // Add a new event listener to the save button to handle updating the event
    saveButtonOriginal.addEventListener('click', () => {
        // Update the event with new details
        events[day][eventIndex].title = eventTitleInput.value;
        
        // Save the updated events to localStorage
        localStorage.setItem('events', JSON.stringify(events));

        // Close the modal and refresh the calendar
        closeModal();
        load();
    });
}

function load() {

    const date = new Date();

    if (nav !== 0){
        date.setMonth(new Date().getMonth() + nav);
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    //setting global date
    currentDate = date;


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

    for(let i = 1; i <= paddingDays + daysInMonth; i++){
        const daySquare = document.createElement('div');

        daySquare.classList.add('day');

        const dayString = `${month + 1}/${i - paddingDays}/${year}`;

        if (i > paddingDays) {
            daySquare.innerText = i - paddingDays;
            const eventForDay = events[dayString];

            if (i - paddingDays === day && nav === 0) {
                daySquare.id = 'currentDay';
            }
        
            if (eventForDay) {
                eventForDay.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.classList.add('event');
                    eventDiv.innerText = event.title;
                    if (event.startTime && event.endTime){
                        eventDiv.innerText = `${event.title} (${event.startTime} - ${event.endTime})`;
                    }
                    daySquare.appendChild(eventDiv);
                });
            }

            console.log(dayString);
        
            daySquare.addEventListener('click', () => openModal(dayString));

        } else {
            daySquare.classList.add('padding');
        }

        calendar.appendChild(daySquare);

        daySquare.addEventListener('click', () => {
            console.log(`Opening modal for ${dayString}`);
            openModal(dayString);
        });
    }

    

}

function closeEditModal() {
    eventTitleInput.classList.remove('error');
    newEventModal.style.display = 'none';
    editEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    eventTitleInput.value = '';
    clicked = null;
    load();
}

function closeModal() {
    eventTitleInput.classList.remove('error');
    newEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    eventTitleInput.value = '';
  
    load();
}

function saveEvent() {
    if (eventTitleInput.value) {
        eventTitleInput.classList.remove('error');

        if (!events[clicked]) {
            events[clicked] = [];
        }

        events[clicked].push({
            title: eventTitleInput.value
        });

        localStorage.setItem('events', JSON.stringify(events));

        const eventIndex = events[clicked].length - 1;
        showEditEventModal(clicked, eventIndex, events[clicked][eventIndex]);
        closeModal();
    } else {
        eventTitleInput.classList.add('error');
    }
}

function deleteEvent(day, eventIndex) {
    // Modify this function to remove a specific event
    // eventIndex is the index of the event to be removed
    if (events[clicked] && events[clicked].length > 0) {
        events[clicked].splice(eventIndex, 1); 
        if (events[clicked].length === 0) {
            delete events[clicked]; 
        }
    }

    localStorage.setItem('events', JSON.stringify(events));
    closeEditModal();
}

function addNote() {
    const noteInput = document.getElementById('noteInput');
    const note = noteInput.value.trim();

    if (note) {
        if (events[clicked] && events[clicked][currentEventIndex]) {
            events[clicked][currentEventIndex].notes = note;

            localStorage.setItem('events', JSON.stringify(events));
            noteInput.value = '';
            showEditEventModal(clicked, currentEventIndex, events[clicked][currentEventIndex]); 
        } else {
            console.error('Event or event date not found');
        }
    } else {
        console.error('No note entered');
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


