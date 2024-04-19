const { MongoClient } = require('mongodb');


const url = 'mongodb+srv://root:agendaapp@agendadb.ovyjmjs.mongodb.net/?retryWrites=true&w=majority&appName=AgendaDB';
const database_name = 'agenda';

module.exports = { initAPI: initAPI };


var client;
var database;


async function initAPI() {
    if (process.env.WA_LOCAL_DATABASE) {
        client = new MongoClient("mongodb://mongo:27017");
		console.log('INF\t| Using local database');
    } else {
        client = new MongoClient(url);
    }

	await client.connect();
	console.log('INF\t| Connected to MongoDB');
	database = client.db(database_name);
	module.exports.auth = database.collection('authentication');
	module.exports.account = database.collection('account');
	module.exports.calendar = database.collection('calendar');
}
