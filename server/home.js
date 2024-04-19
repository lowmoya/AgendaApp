const mongo = require('./mongo');
const { hash } = require('./authentication');
const { ConnectionCheckOutFailedEvent } = require('mongodb');

module.exports = {
	homeAPI: homeAPI,
	shareAPI: shareAPI

};

async function homeAPI(req, res, id, body)
{
	// Get calendar info, make sure the supplied variables are valid
	var calendar = (await mongo.calendar.findOne({ _id: id }));
	var alarms;
	var categories;

	if (calendar == null) {
		result = await mongo.calendar.insertOne({
			_id: id,
			month_year: {},
			alarms: [],
			share_requests: [],
			categories: { work: "#FF0000", personal: "#00FF00", school: "#0000FF" }
		});
		if (!result.acknowledged) {
			console.error("ERR |\tCalendar refusing creation:"
					+ result);
			res.statusCode = 500;
		}
		calendar = {};
		alarms = [];
		categories = { work: "red", personal: "green", school: "blue"};
	} else {
		alarms = calendar.alarms;
		share_requests = calendar.share_requests
		categories = calendar.categories;
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

		if (body?.event?.alarm?.time != undefined) {
			// Move insert index to the index of this alarm, or if it is a new
			// alarm, the end of the list
			let index = 0;
			while (index < alarms.length
					&& (alarms[index].eventMonthYear != body.monthYear
						|| alarms[index].eventDay != body.day
						|| alarms[index].eventIndex != body.index))
				++index;

			// Insert alarm
			alarms[index] = {
				eventMonthYear: body.monthYear,
				eventDay: body.day,
				eventIndex: body.index,
				date: body.event.alarm.time
			};
		}
	} else if (body.type == 'insertCategory') {
		categories[body.label] = body.color;
        mongo.calendar.updateOne({ _id: id }, {
            $set: { categories: categories }
        });
        res.statusCode = 200;
        res.end();
	} else if (body.type == 'insertCategories') {
        mongo.calendar.updateOne({ _id: id }, {
            $set: { categories: body.categories }
        });
        res.statusCode = 200;
        res.end();
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


			// Adjust alarms list
			for (let i = alarms.length - 1; i > -1; --i) {
				if (alarms[i].eventMonthYear != body.monthYear
						|| alarms[i].eventDay != body.day)
					continue;

				// For same day alarms, adjust other alarms event index, or
				// delete the alarm if it belonds to this event
				if (alarms[i].eventIndex > body.index)
					--alarms[i].eventIndex;
				else if (alarms[i].eventIndex == body.index)
					alarms.splice(i, 1);
			}
			
		} catch (error) {
			// Event missing
			res.statusCode = 409;
			res.end();
			return;
		}
	} else if (body.type == 'sync') {
		// Delete expired alarms
		var changed = false;
		// May want to move this to after responding to the client, to avoid
		// a delay on sync calls.
		for (let i = alarms.length - 1; i > -1; --i) {
			if (alarms[i].date < body.date) {
				alarms.splice(i, 1);
				changed = true;
			}
		}

		// Sync for both alarms and events
		const section = {
			events: calendar[body.monthYear] || {},
			alarms: alarms,
			categories: categories
		};
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

		if (changed) {
			mongo.calendar.updateOne({ _id: id }, {
				$set: { alarms: alarms }
			});
		}
		return;
	} else if (body.type == 'syncEvents') {
		// Sync for only events
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
                index:  i,
                event: event
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
	} 
	else {
		// Bad type
		res.statusCode = 400;
		res.end();
		return;
	}

	// Save the data to the database
	// TODO: Look into only saving the effected month
	mongo.calendar.updateOne({ _id: id }, {
		$set: { month_year: calendar, alarms: alarms }
	});

	res.statusCode = 200;
	res.end();
}

async function shareAPI(req, res, id, body)
{
	// Get calendar info, make sure the supplied variables are valid
	var calendar = (await mongo.calendar.findOne({ _id: id }));
	var alarms;

	// Get account info 
	var targetAccount = (await mongo.account.findOne({username: body.username}));
	var originAccount = (await mongo.account.findOne({ _id: id }));
	

	var calendarTarget; 

	if (calendar == null) {
		result = await mongo.calendar.insertOne({
			_id: id,
			month_year: {},
			alarms: [],
			share_requests: []
		});
		if (!result.acknowledged) {
			console.error("ERR |\tCalendar refusing creation:"
					+ result);
			res.statusCode = 500;
		}
		calendar = {};
		alarms = [];
	} else {
		alarms = calendar.alarms;
		share_requests = calendar.share_requests;
		calendar = calendar.month_year;
	}

	if (body.type == "share")
	{
		if (targetAccount == null) {
			// User not found
			res.statusCode = 404;
			res.end();
			return;
		} else {
			// add to other users share request 
			let eventsList = [];
			const startStr = body.startDate.split("-");
			const endStr = body.endDate.split("-");
			
			start = {
				year: parseInt(startStr[0]),
				month: parseInt(startStr[1]),
				day: parseInt(startStr[2]),
			};
			end = {
				year: parseInt(endStr[0]),
				month: parseInt(endStr[1]),
				day: parseInt(endStr[2]),
			};
	
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
								eventsList.push({
									year: year,
									month: month,
									day: day,
									event: event
								});
							}
						}
					}
				}

			calendarTarget = (await mongo.calendar.findOne({_id: targetAccount._id}));
		
			calendarTarget.share_requests.push(
				{
					username: originAccount.username,
					startDate: body.startDate,
					endDate: body.endDate,
					events: eventsList
				}
			)
	
	
			mongo.calendar.updateOne(
					{_id: targetAccount._id},
					{$set: {share_requests: calendarTarget.share_requests}});
			res.statusCode = 200;
      res.end();
      return;
		}

	}
	else if (body.type == 'sharePull') {
		if (share_requests.length == 0)
		{
			res.statusCode = 204;
			res.end();
		}
		else {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(share_requests));
		}
	}
	else if (body.type == 'shareAnswer')
	{
		if(body.accept == true)
		{
			for (eventInfo of share_requests[body.index].events)
			{
				const mY = eventInfo.month+"_"+eventInfo.year
				if(calendar[mY] == undefined)
				{
					calendar[mY] = {};
					calendar[mY][eventInfo.day] = [];
				}
				else if (calendar[mY][eventInfo.day] == undefined)
				{
					calendar[mY][eventInfo.day] = [];
				}
				//calendar[mY][eventInfo.day].alarm.type = 'none';

				calendar[mY][eventInfo.day].push(eventInfo.event);
        if (eventInfo?.event?.alarm?.time != undefined) {
          alarms.push({
            eventMonthYear: mY,
            eventDay: eventInfo.day,
            eventIndex: calendar[mY][eventInfo.day].length,
            date: eventInfo.event.alarm.time
          });
        }
			}
			share_requests.splice(body.index,1);

			res.setHeader('Content-Type', 'application/json');
			res.code = 200;
		}
		else
		{
			share_requests.splice(body.index,1);
		}
		mongo.calendar.updateOne({ _id: id }, {
			$set: { month_year: calendar, share_requests: share_requests}
		});
		res.code = 200;
		res.end();
	}
}

	


	



