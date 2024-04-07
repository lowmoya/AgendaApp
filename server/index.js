// Requirements
const fs = require('fs');
const http = require('http');

const auth = require('./authentication');
const mongo = require('./mongo');
const home = require('./home');


// Constants
const hostname = '127.0.0.1';
const port = 4000;


const pages = [
	'/',
	'/favicon.ico',
	'/session_locator.js',
	'/home',
	'/home.js',
	'/home.css',
	'/login',
	'/login.js',
	'/login.css',
	'/register',
	'/register.js',
	'/register.css',

	/* Resources */
	'/apple.png',
	'/email_background.png',
	'/login_background.png',
];
const page_bindings = [
	{ file: 'frontend/home.html',			type: 'text/html' },
	{ file: 'favicon.ico',					type: 'image/x-icon' },
	{ file: 'frontend/session_locator.js',	type: 'application/javascript' },
	{ file: 'frontend/home.html',			type: 'text/html' },
	{ file: 'frontend/home.js',				type: 'application/javascript' },
	{ file: 'frontend/home.css',			type: 'text/css' },
	{ file: 'frontend/login.html',			type: 'text/html' },
	{ file: 'frontend/login.js',			type: 'application/javascript' },
	{ file: 'frontend/login.css',			type: 'text/css' },
	{ file: 'frontend/register.html',		type: 'text/html' },
	{ file: 'frontend/register.js',			type: 'application/javascript' },
	{ file: 'frontend/register.css',		type: 'text/css' },

	/* Resources */
	{ file: 'frontend/resources/apple.png',	type: 'image/png' },
	{ file: 'frontend/resources/email_background.png',	type: 'image/png' },
	{ file: 'frontend/resources/login_background.png',	type: 'image/png' },
];


// Hosted APIS for the request handler to forward towards.
// /login must be first, requires no authorization,
// /register must be second, requires a cwt and no associated account info,
// order of remaining doesn't matter and will all require a cwt and
// assicated account info.
const apis = [
	'/login',
	'/register',
	'/home',
];
const api_bindings = [
	auth.loginAPI,
	auth.registerAPI,
	home.homeAPI,
]


// Variables
var server;





// Request management
async function requestHandler(req, res) {
	if (req.method == 'GET') {
		let index = pages.indexOf(req.url);
		if (index != -1) {
			supplyPage(res, page_bindings[index].file, page_bindings[index].type);
		} else {
			supplyMissingPage(res);
			console.log(`WRN	| Unsupplied file '${req.url}' requested.`);
		}
	} else if (req.method == 'POST') {
		// Get index of requested api, if invalid respond with bad request.
		const index = apis.indexOf(req.url);
		if (index == -1) {
			res.statusCode = 400;
			res.end();
			return;
		}

		// Read in the requests body
		const body = await new Promise((resolve, reject) => {
			var body = '';
			req.on('data', chunk => body += chunk);
			req.on('end', () => {
				try {
					resolve(JSON.parse(body));
				} catch {
					resolve({});
				}
			});
		});

		// If its a login request, enough information has been read.
		if (index == 0) {
			auth.loginAPI(req, res, body);
			return;
		}


		// Past this point needs info on user's ID and account info status,
		// acquire them here. If no user ID available, end with unauthorized
		// action.
		const id = req.headers.session != undefined ?
			auth.validateCWT(req.headers.session) : null;

		const auth_info = await mongo.auth.findOne({ _id: id })
		if (id == null  || auth_info == null) {
			res.statusCode = 401;
			res.end();
			return;
		}

		const account_info = await mongo.account.findOne({ _id: id });


		// If its a registration request, there should be no existing
		// account info. Either forward to registration API or send a
		// conflicting state response code.
		if (index == 1) {
			if (account_info == null) {
				auth.registerAPI(req, res, id, body);
				return;
			} else {
				res.statusCode = 409;
				res.end();
				return;
			}
		}

		// After this point, it's assumed that the user needs account info
		// to access any other APIs
		if (account_info == null) {
			res.statusCode = 403;
			res.end();
			return;
		}

		// Forward to the appropriate API
		api_bindings[index](req, res, id, body);
	} else {
		// Unimplemented Method called.
		res.statusCode = 405;
		res.end();
	}
}


function supplyPage(res, file, type) {
	fs.readFile(file, (err, data) => {
		if (err) {
			supplyMissingPage(res);
			console.error(`ERR	| File '${file}' missing.`);
		} else {
			res.statusCode = 200;
			res.setHeader('Content-Type', type);
			res.end(data);
			console.error(`INF	| Supplied client '${file}'.`);
		}
	});
}


function supplyMissingPage(res) {
	res.statusCode = 404;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Page missing.');
}


// Create the server
async function initialize() {
	await mongo.initAPI();
	await auth.initAPI();
	// Wrapped in try to prevent any missed malformed data exceptions from
	// crashing the server.
	server = http.createServer((req, res) => {
		try {
			requestHandler(req, res);
		} catch (error) {
			console.error(error);
		}
	});
	server.listen(port, () => {
		console.log(`INF	| Server running at http//${hostname}:${port}/`);
	});
}

initialize();
