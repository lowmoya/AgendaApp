// Requirements
const fs = require('fs');
const http = require('http');

const auth = require('./authentication');
const mongo = require('./mongo');
const home = require('./home');


// Constants
const hostname = '0.0.0.0';
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
	'/add.png',
	'/cloud.png',
	'/leaves.png',
	'/left-arrow.png',
	'/left-arrow-acorn.png',
	'/main_tree.png',
	'/right-arrow.png',
	'/search.png',
	'/weekly-view.png',
	'/weekly-view-mobile.png',
	'/pop-up.png',
	'/pop-up2.png',
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
	{ file: 'frontend/resources/apple.png',					type: 'image/png' },
	{ file: 'frontend/resources/email_background.png',		type: 'image/png' },
	{ file: 'frontend/resources/login_background.png',		type: 'image/png' },
	{ file: 'frontend/resources/add.png',					type: 'image/png' },
	{ file: 'frontend/resources/cloud.png',					type: 'image/png' },
	{ file: 'frontend/resources/leaves.png',				type: 'image/png' },
	{ file: 'frontend/resources/left-arrow.png',			type: 'image/png' },
	{ file: 'frontend/resources/left-arrow-acorn.png',		type: 'image/png' },
	{ file: 'frontend/resources/main_tree.png',				type: 'image/png' },
	{ file: 'frontend/resources/right-arrow.png',			type: 'image/png' },
	{ file: 'frontend/resources/search.png',				type: 'image/png' },
	{ file: 'frontend/resources/weekly-view.png',			type: 'image/png' },
	{ file: 'frontend/resources/weekly-view-mobile.png',	type: 'image/png' },
	{ file: 'frontend/resources/pop-up.png',				type: 'image/png' },
	{ file: 'frontend/resources/pop-up2.png',				type: 'image/png' },
];
const static_pages = [];


// Hosted APIS for the request handler to forward towards.
// /login must be first, requires no authorization,
// /register must be second, requires a cwt and no associated account info,
// order of remaining doesn't matter and will all require a cwt and
// assicated account info.
const apis = [
	'/login',
	'/register',
	'/home',
	'/share'
];
const api_bindings = [
	auth.loginAPI,
	auth.registerAPI,
	home.homeAPI,
	home.shareAPI
]


// Variables
var server;





// Request management
async function requestHandler(req, res) {
	if (req.method == 'GET') {
		let index = pages.indexOf(req.url);
		if (index != -1) {
			supplyPage(res, index);
		} else {
			supplyMissingPage(res);
			console.log(`WRN\t|Unsupplied file '${req.url}' requested.`);
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


function supplyPage(res, index) {
    if (process.env.WA_RELEASE) {
        res.statusCode = 200;
        res.setHeader('Content-Type', page_bindings[index].type);
        res.end(static_pages[index]);
    } else {
        fs.readFile(page_bindings[index].file, (err, data) => {
            if (err) {
                supplyMissingPage(res);
                console.error(`ERR\t| File '${file}' missing.`);
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', page_bindings[index].type);
                res.end(data);
                console.log('INF\t|Supplied client "'
                    + page_bindings[index].file + '"');
            }
        });
    }
}


function supplyMissingPage(res) {
	res.statusCode = 404;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Page missing.');
}


async function preloadPages() {
	console.log("INF\t| Starting page preloading...");
	for (let binding of page_bindings) {
		static_pages.push(new Promise((res, req) => {
			fs.readFile(binding.file, (err, data) => {
				if (err) {
					supplyMissingPage(res);
					console.error(`ERR\t|File '${file}' missing.`);
					res('Page missing.');
				} else {
					res(data);
				}
			});
		}));
	}

    for (p in static_pages) {
        static_pages[p] = await static_pages[p];
    }

	console.log("INF\t| Finished page preloading");
}


// Create the server
async function initialize() {
	if (process.env.WA_RELEASE) {
		const pagesPromise = preloadPages();
		await mongo.initAPI();
		await pagesPromise;
	} else {
		await mongo.initAPI();
	}

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
		console.log(`INF\t| Server running at http//${hostname}:${port}/`);
	});
}

initialize();
