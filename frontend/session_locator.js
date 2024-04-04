async function assertSessionLocation()
{
	if (localStorage.session == undefined) {
		if (window.location.pathname != '/login')
			window.location = '/login';
		return;
	}


	const resp = await fetch('/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: 'session', session: localStorage.session })
	});


	if (resp.status == 200) {
		if (window.location.pathname == '/login' ||
				window.location.pathname == '/register') {
			window.location = '/home';
		}
	} else if (resp.status == 403) {
		if (window.location.pathname != '/register') {
			window.location = '/register';
		}
	} else {
		delete localStorage.session;
		if (window.location.pathname != '/login') {
			window.location = '/login';
		}
	}
}

assertSessionLocation();
