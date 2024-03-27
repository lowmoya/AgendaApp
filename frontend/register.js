var form = document.getElementById('form');

async function register()
{
	var invalid = false;
	for (let i = form.children.length; i--;) {
		if (form.children[i].reportValidity()) {
			form.children[i].classList.remove('invalid');
		} else {
			form.children[i].classList.add('invalid');
			invalid = true;
		}
	}

	if (invalid)
		return;

	const resp = await fetch('/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Session': localStorage.session
		},
		body: JSON.stringify(Object.fromEntries(new FormData(form)))
	});
	console.log(resp);

	switch (resp.status) {
		case 200:
			window.location = '/home';
			return;
		case 400:
			alert('Bad form data');
			break;
		case 401:
			delete localStorage.session;
			window.location = '/login';
			return;
		case 409:
			alert('Username in use');
			break;
		default:
			console.log('Code', resp.status);
	}
}
