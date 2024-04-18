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
              if (entry.event.notes.length != 0)
                txt += 'Notes: ' + entry.event.notes + '\n';
              if (entry.event.imagePath != undefined)
                txt += 'Image: ' + entry.event.imagePath + '\n';
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

function shareEvents() {
    const cancelButton = document.getElementById("cancelShare");
    const confirmButton = document.getElementById("confirmShare");
    
    

    // Show the share modal
    shareModal.style.display = "block";
    backDrop.style.display = "block";
    shareModal.style.opacity = 1;
    shareModal.style.visibility = "visible";


    confirmButton.onclick = () =>
    {
        const username = document.getElementById("shareUser").value;
        const startDate = document.getElementById("shareStart").value;
          const endDate = document.getElementById("shareEnd").value;
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

        fetch("/share", {
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

        shareModal.style.display = "none";
        backDrop.style.display = "none";
        alert("Share request to: " + username +" was sent.");
    }
}

// Below are the functions for the weekly note modal functionality
function getWeekNumber(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
}

function getWeeklyNote() {
    const editWeeklyNoteInput = document.getElementById('weeklyNoteInput');
    const weeklyNoteModal = document.getElementById('weeklyNoteModal');

    // Open the weekly note modal
    document.getElementById('openWeeklyNoteModal').addEventListener('click', () => {
        weeklyNoteModal.style.display = 'block';
        weeklyNoteModal.style.opacity = 1;
        weeklyNoteModal.style.visibility = 'visible';
        backDrop.style.display = 'block';
        weekOfNote.style.display = 'block';
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

        //const firstDayOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 1); // Adjust for first day of week assuming Sunday is start
        //const day = firstDayOfWeek.getDate();
        if (!events[monthYear]) {
            events[monthYear] = {};
            events[monthYear][weekId] = [];
        } else if (!events[monthYear][weekId]){
            events[monthYear][weekId] = [];
        }
        var weeklyHome = events[monthYear][weekId];

        // Save to local storage (optional, if you want to cache or use locally)
        weeklyHome.push({ note: updatedWeeklyNote });
        localStorage.setItem('events', JSON.stringify(events));

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
    for (key in categories) {
        if (key == 'work' || key == 'personal' || key == 'school')
          continue;
        const option = document.createElement('option');
        option.value = key.toLowerCase();
        option.textContent = key;
        catDropdown.insertBefore(option, catDropdown.querySelector('option[value="custom"]'));
    }
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
    newCategory.style.display = 'none';
    

    // Load set category values
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


    // Set image inputs
    const imageLabel = document.getElementById('edit-event-image-label');
    editEventModalImagePath = event.imagePath;
    editEventModalImageContent = event.imageContent;
    imageLabel.innerText = editEventModalImagePath == undefined ?
        'None' : editEventModalImagePath;

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

            if (newName.length == 0)
                newName = 'personal';
            categoryName = newName;

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
                let end = request.events.length - 1;
                const startDate = request.events[0].month + "/" + request.events[0].day + "/" + request.events[0].year;
                const endDate = request.events[end].month + "/" + request.events[end].day + "/" + request.events[end].year;
                const confirmation = confirm(request.username +" wants to share events " + startDate + " to " +
                endDate +" with you, do you wish to proceed?");

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
                    alert("Share request denied.")
                }
            }
        }
    }



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

        /* Adjust content */
        const sectionEvents = events[sectionDate.getMonth() + 1 + '_'
                + sectionDate.getFullYear()]?.[sectionDate.getDate()];
        if (sectionEvents == undefined)
            continue;
        for (let i in sectionEvents) {
            const child = document.createElement('button');
            child.innerText = sectionEvents[i].title;
            child.style.borderColor
              = categories[sectionEvents[i].category];
            if (sectionEvents[i].imageContent != undefined) {
                const image = document.createElement('img');
                image.src = sectionEvents[i].imageContent;
                child.appendChild(image);
            }

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






    /* Monthly view
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
    */
}


function loadEditModalImage() {
    const selector = document.getElementById('image');
    const label = document.getElementById('edit-event-image-label');

    const reader = new FileReader();
    reader.onload = () => {
        label.innerText = selector.files[0].name;
        editEventModalImagePath = selector.files[0].name;
        editEventModalImageContent = reader.result;
    };

    label.innerText = 'Loading...';
    reader.readAsDataURL(selector.files[0]);
}


document.addEventListener('DOMContentLoaded', function() {
    //getWeeklyNote();
    loadCategories();
    load();
});
