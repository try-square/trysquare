'use strict';

const React = require('react');

function LoginForm({ onSubmit }) {
	const [email,    setEmail]    = React.useState('');
	const [password, setPassword] = React.useState('');
	const [error,    setError]    = React.useState('');

	function handleSubmit(e) {
		e.preventDefault();
		if (!email.includes('@')) {
			setError('Invalid email address');
			return;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters');
			return;
		}
		setError('');
		if (onSubmit) onSubmit({ email, password });
	}

	return React.createElement('form', { onSubmit: handleSubmit },
		React.createElement('input', {
			'aria-label': 'Email',
			type:         'email',
			value:        email,
			onChange:     e => setEmail(e.target.value),
		}),
		React.createElement('input', {
			'aria-label': 'Password',
			type:         'password',
			value:        password,
			onChange:     e => setPassword(e.target.value),
		}),
		error && React.createElement('span', { role: 'alert' }, error),
		React.createElement('button', { type: 'submit' }, 'Sign in')
	);
}

LoginForm.displayName = 'LoginForm';
module.exports = { LoginForm };
