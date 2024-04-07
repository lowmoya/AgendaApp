const mongo = require('./mongo');
const { hash } = require('./authentication');

module.exports = {
	homeAPI: homeAPI
};

async function homeAPI(req, res, id, body)
{
	// Get calendar info, make sure the supplied variables are valid
	var calendar = (await mongo.calendar.findOne({ _id: id }));
	var alarms;

	if (calendar == null) {
		result = await mongo.calendar.insertOne({
			_id: id,
			month_year: {},
			alarms: []
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

		console.log(body.event.alarm.time);
		if (body.event.alarm.time != undefined) {
			// Move insert index to the index of this alarm, or if it is a new
			// alarm, the end of the list
			let index = 0;
			while (index < alarms.length
					&& (alarms[index].eventMonthYear != body.monthYear
						|| alarms[index].eventDay != body.day
						|| alarms[index].eventIndex != body.index))
				++index;
			console.log('Inserting alarm to', index);

			// Insert alarm
			alarms[index] = {
				eventMonthYear: body.monthYear,
				eventDay: body.day,
				eventIndex: body.index,
				date: body.event.alarm.time
			};
		}
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
		console.log(alarms);

		// Sync for both alarms and events
		const section = {
			events: calendar[body.monthYear] || {},
			alarms: alarms
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
	} else {
		// Bad  type
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
