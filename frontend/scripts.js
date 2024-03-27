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

    console.log(clicked);
    const eventsForDay = events[clicked] || [];
    newEventModal.style.display = 'block'; // Always show the modal to add a new event

    // Display existing events in the modal or some other part of your UI
    // You might need to clear the previous list of events displayed in the modal or UI element before adding the new ones
    const eventsList = document.getElementById('eventsList'); // Assuming you have a list element in your modal or UI to display events
    eventsList.innerHTML = ''; // Clear previous events

    eventsForDay.forEach((event, index) => {
        const eventElement = document.createElement('button');
        eventElement.classList.add('event-button');
        console.log(event);
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
    const editNoteInput = document.getElementById('noteInput'); 
    const updateButton = document.getElementById('updateButton');
    const notesContainer = document.getElementById('listOfNotes'); // Get the notes container

    newEventModal.style.display = 'none';
    backDrop.style.display = 'block';

 
    // Set the current event details in the input fields
    editEventTitleInput.value = event.title;
    currentEventIndex = eventIndex;
    editNoteInput.value = event.notes;

    notesContainer.innerHTML = '';


    // Show the edit event modal
    editEventModal.style.display = 'block';
    backDrop.style.display = 'block';
    editEventModal.style.opacity = 1;
    editEventModal.style.visibility = 'visible';

    // Handle the update button click
    updateButton.onclick = () => {
        const updatedTitle = editEventTitleInput.value;
        const updatedNote = editNoteInput.value.trim(); // Get the updated note text
    
        // Update the event title
        events[day][eventIndex].title = updatedTitle;
    
        // Overwrite the existing note with the new note
        if (events[day] && events[day][eventIndex]) {
            events[day][eventIndex].notes = updatedNote; // Directly set the note to the new content
        }
    
        localStorage.setItem('events', JSON.stringify(events)); // Save the updated events to localStorage
    
        // Close the edit event modal and refresh the calendar
        editEventModal.style.display = 'none';
        backDrop.style.display = 'none';
        load(); // Refresh the calendar view to reflect changes
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
    const noteModal = document.getElementById('editEventModal');
    const noteInput = document.getElementById('noteInput'); // This is your textarea for notes
    noteModal.style.display = 'block';

    // Load existing note if present, directly into the textarea
    const existingNote = events[day] && events[day][eventIndex] && events[day][eventIndex].notes ? events[day][eventIndex].notes : "";
    noteInput.value = existingNote;

    // Save button logic
    document.getElementById('saveNoteButton').onclick = () => {
        // Save changes to the note
        const updatedNote = noteInput.value.trim(); // Get the updated note content
    
        if (!events[day]) {
            events[day] = [];
        }
        if (!events[day][eventIndex]) {
            events[day][eventIndex] = { notes: [] };
        }
    
        // Replace the entire note content
        events[day][eventIndex].notes = [updatedNote];
    
        // Persist changes
        localStorage.setItem('events', JSON.stringify(events));
    
        // Close modal
        noteModal.style.display = 'none';
    };

    // Cancel button logic
    document.getElementById('cancelNoteButton').onclick = () => {
        // Discard changes and close modal
        noteModal.style.display = 'none';
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

            console.log(dayString);
        
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
            title: eventTitleInput.value,
            notes: [] // Initialize notes as an array
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
        events[clicked].splice(eventIndex, 1); // Remove the specific event
        if (events[clicked].length === 0) {
            delete events[clicked]; // Remove the property if no events left for this day
        }
    }

    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
}

function addNote() {
    const noteInput = document.getElementById('noteInput');
    const note = noteInput.value.trim();

    if (note) {
        if (events[clicked] && events[clicked][currentEventIndex]) {
            events[clicked][currentEventIndex].notes.push(note);

            localStorage.setItem('events', JSON.stringify(events));
            noteInput.value = '';
            showEditEventModal(clicked, currentEventIndex, events[clicked][currentEventIndex]); // Refresh the modal to display the newly added note
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
    // Your code here will run after the DOM is fully loaded
    initButtons();
    load();
});

