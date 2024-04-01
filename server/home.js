const mongo = require('./mongo');
const { hash } = require('./authentication');

module.exports = {
	homeAPI: homeAPI
};

async function homeAPI(req, res, id, body)
{
	// Get calendar info, make sure the supplied variables are valid
	var calendar = (await mongo.calendar.findOne({ _id: id })).month_year;


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
