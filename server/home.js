const mongo = require('./mongo');
const { hash } = require('./authentication');

module.exports = {
	homeAPI: homeAPI
};

async function homeAPI(req, res, id, body)
{
	// Get calendar info, make sure the supplied variables are valid
	var calendar = (await mongo.calendar.findOne({ _id: id }));

	// Get account info 
	//var account = await mongo.account.findOne({username: username});

	if (calendar == null) {
		result = await mongo.calendar.insertOne({
			_id: id,
			month_year: {}
		});
		if (!result.acknowledged) {
			console.error("ERR |\tCalendar refusing creation:"
					+ result);
			res.statusCode = 500;
		}
		calendar = {};
	} else {
		calendar = calendar.month_year;
	}
	
	// Perform the requested action on the dataset
	if (body.type == 'insert') {
		// Insert the containers for this event if they're missing
		if (calendar[body.monthYear] == undefined) {
			calendar[body.monthYear] = {}
			calendar[body.monthYear][body.day] = []
		} else if (calendar[body.monthYear][body.day] == undefined) {
			calendar[body.monthYear][body.day] = [];
		}

		// Insert event
		calendar[body.monthYear][body.day][body.index] = body.event;
	} else if (body.type == 'delete') {
		try {
			// Remove specific event
        	calendar[body.monthYear][body.day].splice(body.index, 1); 
			
			// Delete any empty structures
			if (calendar[body.monthYear][body.day].length == 0) {
				delete calendar[body.monthYear][body.day];
				if (Object.keys(calendar[body.monthYear]).length == 0)
					delete calendar[body.monthYear];
			}
		} catch (error) {
			// Event missing
			res.statusCode = 409;
			res.end();
			return;
		}
	} else if (body.type == 'sync') {
		const section = calendar[body.monthYear] || {};
		if (hash(JSON.stringify(section)) == body.hash) {
			// User is up to date
			res.statusCode = 204;
			res.end();
		} else {
			// User is out of sync
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(section));
		}

		// Doesn't need to update database for this type so end here
		return;
  } else if (body.type == "search") {
    const startStr = body.startDate || "";
    const endStr = body.endDate || "";
    const startSegments = startStr.split("-");
    const endSegments = endStr.split("-");

    let start, end;
    let eventsList = [];

    currentDate = new Date();

    if (startSegments.length != 3) {
      start = {
        year: currentDate.getFullYear() - 5,
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
    } else {
      start = {
        year: parseInt(startSegments[0]),
        month: parseInt(startSegments[1]),
        day: parseInt(startSegments[2]),
      };
    }

    if (endSegments.length != 3) {
      end = {
        year: currentDate.getFullYear() + 5,
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
    } else {
      end = {
        year: parseInt(endSegments[0]),
        month: parseInt(endSegments[1]),
        day: parseInt(endSegments[2]),
      };
    }

    for (let year = start.year; year <= end.year; ++year) {
      for (let month = 0; month <= 12; ++month) {
        // check if before or after start month
        if (year == start.year && month < start.month)
  			continue;
		if (year == end.year && month > end.month)
  			break; 
        // Skip if no contents
        const monthEvents = calendar[month + "_" + year];
        if (monthEvents == undefined) continue;

        for (let day = 0; day <= 31; ++day) {
          // check if before or after start day
          if (year == start.year && month == start.month) if (day < start.day) continue;
          if (year == end.year && month == end.month) if (day > end.day) break;
          // Skip if no content
          if (monthEvents[day] == undefined) continue;
          for (let i = 0; i < monthEvents[day].length; i++) {
            let event = monthEvents[day][i];
            if (event.title.split(" ").some((word) => word.toLowerCase().startsWith(body.searchQuery.toLowerCase())) ||
				event.notes.split(" ").some((word) => word.toLowerCase().startsWith(body.searchQuery.toLowerCase()))){
				eventsList.push({
					year: year,
					month: month,
					day: day,
					title: event.title,
					notes: event.notes
				});
			}
            
          }
        }
      }
    }

    const response = {
      events: eventsList,
      message: "success",
    };

    // Send the response back to the client
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
	} else {
		// Bad  type
		res.statusCode = 400;
		res.end();
		return;
	}

	// Save the data to the database
	// TODO: Look into only saving the effected month
	mongo.calendar.updateOne({ _id: id }, {
		$set: { month_year: calendar }
	});

	res.statusCode = 200;
	res.end();
}
