
// Start up behaviors
async function onLoad()
{
	if (sessionStorage.google_login_state != undefined) {
		// There's a google state, so access the url to get the access token that's accompanied with it.
		// Send the access token to the login API, if any part of this fails, delete state and remain.
		// If everything succeeds, store the session token that comes back and redirect to /home or /register
		
		let correct_state = sessionStorage.google_login_state;
		sessionStorage.removeItem('google_login_state');
		let uri = window.location.href;
		let parameters = uri.substring(uri.indexOf('#') + 1).split('&').map(
			(p) => { return p.split('='); });

		let state = undefined;
		let token = undefined;
		let lifespan = undefined;
		for (i in parameters) {
			switch(parameters[i][0]) {
				case 'state':
					state = parameters[i][1];
					break;
				case 'access_token':
					token = parameters[i][1];
					break;
				case 'expires_in':
					lifespan = parameters[i][1];
					break;
			}
		}

		if (state != correct_state || token == undefined  || lifespan == undefined) {
			return;
		}

		resp = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type: 'google',
				token: token
			})
		});
		// Just rely on response code
		if (resp.code == 400) {
			alert('Failed to authorize through Google.');
		} else {
			localStorage.session = await resp.text();
			window.location = resp.headers.get('location');
		}


		// call assertSessionLocation?
	}
}


// Login callsq
function googleLogin()
{
	var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
	var form = document.createElement('form');
	form.setAttribute('method', 'GET');

	hex_chars = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' ];
	state = '';
	for (var i = 0; i < 32; i++)
		state += hex_chars[Math.floor(Math.random() * 16)];
	sessionStorage.setItem('google_login_state', state);
	var params = {
		'scope': 'https://www.googleapis.com/auth/userinfo.profile',
		'include_granted_scope': 'true',
		'response_type': 'token',
		'state': state,
		'redirect_uri': 'http://localhost:4000/login',
		'client_id': '687085718266-a06o9obdvi4o95qsi3okj8t1em5kpade.apps.googleusercontent.com'
	};
	for (var p in params) {
		var input = document.createElement('input');
		input.setAttribute('type', 'hidden');
		input.setAttribute('name', p);
		input.setAttribute('value', params[p]);
		form.appendChild(input);
	}

	form.setAttribute('action', oauth2Endpoint);
	document.body.appendChild(form);
	form.submit();
}

async function emailLogin()
{
	var emailField = document.getElementById('email');
	var passwordField = document.getElementById('password');


	// Input validity checking
	var invalid = 0; 
	if (emailField.reportValidity()) {
		emailField.classList.remove('invalid');
	} else {
		emailField.classList.add('invalid');
		invalid = 1;
	}
	
	if (passwordField.reportValidity()) {
		passwordField.classList.remove('invalid');
	} else {
		passwordField.classList.add('invalid');
		invalid = 1;
	}

	if (invalid) {
		return;
	}


	// Attempt to login
	resp = await fetch('/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			type: 'email',
			email: emailField.value,
			password: passwordField.value
		})
	});


	if (resp.status == 400) {
		alert('Failed to authorize through email.');
	} else {
		localStorage.session = await resp.text();
		window.location = resp.headers.get('location');
	}
}

// Util functionality
function switchPanes(active, inactive)
{
	document.getElementById(active).classList.add('disabled');
	document.getElementById(inactive).classList.remove('disabled');
}

onLoad();
