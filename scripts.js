let nav = 0;
let clicked = null;
let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : {};

const calendar = document.getElementById('calendar');
const newEventModal =  document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop =  document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventTitleInput');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function openModal(date) {
    clicked = date;

    const eventsForDay = events[clicked] || [];
    newEventModal.style.display = 'block'; // Always show the modal to add a new event

    // Display existing events in the modal or some other part of your UI
    // You might need to clear the previous list of events displayed in the modal or UI element before adding the new ones
    const eventsList = document.getElementById('eventsList'); // Assuming you have a list element in your modal or UI to display events
    eventsList.innerHTML = ''; // Clear previous events

    eventsForDay.forEach((event, index) => {
        const eventElement = document.createElement('button');
        eventElement.classList.add('event-button');
        eventElement.innerText = event.title;
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the openModal event
            showEditEventModal(clicked, index, event);
        });
        eventsList.appendChild(eventElement);
    });

    backDrop.style.display = 'block';
}

function showEditEventModal(day, eventIndex, event) {
    const editEventModal = document.getElementById('editEventModal');
    const editEventTitleInput = document.getElementById('editEventTitleInput');
    const updateButton = document.getElementById('updateButton');

    newEventModal.style.display = 'none';
    
    backDrop.style.display = 'block'
    
    // Set the current event details in the input fields
    editEventTitleInput.value = event.title;

    // Show the edit event modal
    editEventModal.style.display = 'block';
    backDrop.style.display = 'block';

    // Update the event when the update button is clicked
    updateButton.onclick = () => {
        // Get the updated event title from the input
        const updatedTitle = editEventTitleInput.value;

        // Update the event in the events array
        events[day][eventIndex].title = updatedTitle;

        // Save the updated events to localStorage
        localStorage.setItem('events', JSON.stringify(events));

        // Close the edit event modal and refresh the calendar
        editEventModal.style.display = 'none';
        backDrop.style.display = 'none';
        load();
    };

    document.getElementById('cancelEditButton').addEventListener('click', () => {
        document.getElementById('editEventModal').style.display = 'none';
        backDrop.style.display = 'none';
    });
}

function editEvent(day, eventIndex, event) {
    // Pre-fill the event details in the modal
    eventTitleInput.value = event.title; // Assuming `event.title` contains the event name

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

function openNoteModal(day, eventIndex) {
    const noteModal = document.getElementById('noteModal'); // Ensure this modal exists for adding notes
    const saveNoteButton = document.getElementById('saveNoteButton'); // Ensure this button exists in your note modal

    noteModal.style.display = 'block';

    saveNoteButton.onclick = () => {
        const noteInput = document.getElementById('noteInput'); // Ensure this input field exists in your note modal
        const note = noteInput.value;
        // Add the note to the event
        if (!events[day][eventIndex].notes) {
            events[day][eventIndex].notes = []; // Initialize notes array if it doesn't exist
        }
        events[day][eventIndex].notes.push(note);

        localStorage.setItem('events', JSON.stringify(events));
        noteModal.style.display = 'none';
        openDayModal(day); // Refresh the day modal to show updated info
    };
}

function load() {

    const date = new Date();

    if (nav !== 0){
        date.setMonth(new Date().getMonth() + nav);
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();


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
        // const noteIcon = document.createElement('div');

        daySquare.classList.add('day');

        const dayString = `${month + 1}/${i - paddingDays}/${year}`;

        if (i > paddingDays) {
            daySquare.innerText = i - paddingDays;
            const eventForDay = events[dayString];
            // const notesForEvent = notes.find(e => e.events === eventForDay);

            if (i - paddingDays === day && nav === 0) {
                daySquare.id = 'currentDay';
            }
        
            if (eventForDay) {
                eventForDay.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.classList.add('event');
                    eventDiv.innerText = event.title;
                    daySquare.appendChild(eventDiv);
                });
            }
        
            daySquare.addEventListener('click', () => openModal(dayString));
            // noteIcon.addEventListener('click', () => openNote(eventForday));

        } else {
            daySquare.classList.add('padding');
        }

        calendar.appendChild(daySquare);
        // calendar.appendChild(noteForDay);

        daySquare.addEventListener('click', () => {
            console.log(`Opening modal for ${dayString}`);
            openModal(dayString);
        });
    }

    

}

function closeModal() {
    eventTitleInput.classList.remove('error');
    newEventModal.style.display = 'none';
    deleteEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    eventTitleInput.value = '';
    clicked = null;
    load();
}

function saveEvent() {
    if (eventTitleInput.value) {
        eventTitleInput.classList.remove('error');

        if (!events[clicked]) {
            events[clicked] = []; // Initialize if no events for this day
        }

        events[clicked].push({
            title: eventTitleInput.value,
        });

        localStorage.setItem('events', JSON.stringify(events));
        closeModal();
    } else {
        eventTitleInput.classList.add('error');
    }
}

function deleteEvent(day, eventIndex) {
    // Modify this function to remove a specific event
    // eventIndex is the index of the event to be removed
    if (events[clicked] && events[clicked].length > 0) {
        events[clicked].splice(eventIndex, 1); // Remove the specific event
        if (events[clicked].length === 0) {
            delete events[clicked]; // Remove the property if no events left for this day
        }
    }

    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
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

function addNote() {
    clicked = eventForDay;


}

document.addEventListener('DOMContentLoaded', function() {
    // Your code here will run after the DOM is fully loaded
    initButtons();
    load();
});