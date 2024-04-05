/* Requirements */
const crypto = require('crypto');
const fs = require('fs/promises');
const https = require('https');
const { ObjectId } = require('mongodb');


const mongo = require('./mongo');


module.exports = {
	initAPI: initAPI,
	loginAPI: loginAPI,
	registerAPI: registerAPI,
	validateCWT: validateCWT,
	hash: hash
};


/* Constants */
const cwt_duration = 31 * 24 * 60 * 60;
const email_validator = /^([\w-]+(\.(?!@))?)+@([\w-]+\.)+[a-zA-Z]{2,}$/;
const password_validator = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[! @#$%^&*+=<{([|\])}>,.:;?"'/\\_-])[\w~`! @#$%^&*+=<{([|\])}>,.:;?"'/\\_-]{8,64}$/;


/* Variables */
var key;



/* LoginAPI login specifications. */
async function googleLogin(req, res, body)
{
	var google_account;
	var error = false;
	try {
		await new Promise((resolve, reject) => {
			https.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + body.token, get => {
				let data = '';
				get.on('data', piece => {data += piece});
				get.on('end', () => {
					google_account = JSON.parse(data);
					resolve();
				});
			}).on('error', err => {
				error = true;
				console.log(err);
			});
		});
	} catch (err) {
		error = true;
	}

	if (error || google_account.error != undefined) {
		res.statusCode = 400;
		res.end();
		return;
	}

	var auth_info = await mongo.auth.findOne({ google_id: google_account.id });
	if (auth_info == null) {
		await mongo.auth.insertOne({ google_id: google_account.id });
		auth_info = await mongo.auth.findOne({ google_id: google_account.id });
		res.setHeader('location', '/register');
	} else {
		res.setHeader('location', '/home');
	}

	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end(createCWT(auth_info._id));
}


async function emailLogin(req, res, body)
{
	// Make sure valid email and password were submitted
	if (body.email.match(email_validator) == null ||
			body.password.match(password_validator) == null) {
		res.statusCode = 400;
		res.end();
		return;
	}

	var auth_info = await mongo.auth.findOne({email: body.email});
	if (auth_info == null) {
		// Create new account or fail if password is not a mach
		let salt = crypto.randomBytes(8).toString('hex');
		await mongo.auth.insertOne({
			email: body.email,
			password: saltedHash(body.password, salt),
			salt: salt,
		});

		auth_info = await mongo.auth.findOne({email: body.email});
		res.setHeader('location', '/register');
	} else if (auth_info.password != hash(body.password, auth_info.salt)) {
		// Account exists, bad password
		res.statusCode = 400;
		res.end();
		return
	} else {
		// Account exists, good password
		res.setHeader('location', '/home');
	}



	// Return CWT, Redirect to specified page
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end(createCWT(auth_info._id));
}


async function sessionLogin(req, res, body)
{
	// Constrict to login page
	var id = validateCWT(body.session);
	if (id == null) {
		res.statusCode = 401;
		res.end();
		return;
	}

	var auth_info = await mongo.auth.findOne({ _id: id });
	if (auth_info == null) {
		res.statusCode = 401;
		res.end();
		return;
	}

	// Constrict to register page
	var account_info = await mongo.account.findOne({ _id: id });
	if (account_info == null) {
		res.statusCode = 403;
		res.end();
		return;
	}

	// Free range
	res.statusCode = 200;
	res.end();
}

async function loginAPI(req, res, body)
{
	switch(body.type) {
		case 'google':
			googleLogin(req, res, body);
			break;
		case 'email':
			emailLogin(req, res, body);
			break;
		case 'session':
			sessionLogin(req, res, body);
			break;
		default:
			console.log('Bad signin type: ', body.type);
			res.statusCode = 400;
			res.end();
	}
}


/* RegisterAPI specifications */
async function registerAPI(req, res, id, body)
{
	// Check that fields meet requirements
	if (body.username.length < 3 || body.username.length > 16 ||
			body.name.length < 3 || body.name.length > 32) {
		res.statusCode = 400;
		res.end();
		return;
	}
	

	// Check if the username is in use
	const accounts = await mongo.account.findOne({ username: body.username });
	if (accounts != null) {
		res.statusCode = 409;
		res.end();
		return;
	}
	
	
	// Save info into account info database
	// Could also prepare other databases for storage here
	mongo.account.insertOne({
		_id: id,
		username: body.username,
		name: body.name
	});
	console.log(await mongo.calendar.insertOne({
		_id: id,
		month_year: {}
	}));
	res.statusCode = 200;
	res.end();
	return;
}




/* Crypto specifications */
// Create a Custom Web Token.
// Used for user authentication via encrypting the user id and experation date.
// And gives it to the user. IV is the last 16 bytes of the CWT.
function createCWT(account_id) {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes256', key, iv);

	const packet = {};
	packet.account_id = account_id.toString();
	packet.expiration = Date.now() + cwt_duration;
	packet.hash = hash(packet.account_id + packet.expiration);

	var encrypted = cipher.update(JSON.stringify(packet));
	encrypted = Buffer.concat([encrypted, cipher.final()]);

	return Buffer.concat([encrypted, iv]).toString('base64');
}


function validateCWT(cwt) {
	try {
		cwt = Buffer.from(cwt, 'base64');

		const decipher = crypto.createDecipheriv('aes256', key, cwt.slice(-16));
		var decrypted = decipher.update(cwt.slice(0, -16));
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		packet = JSON.parse(decrypted);

		if (packet.expiration == undefined || packet.account_id == undefined ||
				packet.hash == undefined || packet.expiration < Date.now() ||
				packet.hash != hash(packet.account_id + packet.expiration))
			return null;
		return new ObjectId(packet.account_id);
	} catch(err) {
		return null;
	}
}


function hash(contents) {
	return crypto.createHash('sha256').update(contents).digest('base64');
}

function saltedHash(contents, salt) {
	return crypto.createHash('sha256').update(contents + salt).digest('base64');
}

async function initAPI() {
	try {
		key = await fs.readFile('.cwt.key');
	} catch (error) {
		console.log('WRN	| Generating new CWT Key');
		key = (await new Promise((resolve, reject) => {
			crypto.generateKey('aes', {length: 256}, (err, key) => {
				if (err) throw err;
				resolve(key)
			});
		})).export();
		fs.writeFile('.cwt.key', key);
	}
}
