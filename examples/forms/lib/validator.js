'use strict';

function validateEmail({ email }) {
	if (typeof email !== 'string' || email.length === 0) {
		return { valid: false, error: 'Email is required' };
	}
	const at = email.indexOf('@');
	if (at < 1 || at === email.length - 1) {
		return { valid: false, error: 'Invalid email address' };
	}
	return { valid: true };
}

function validatePassword({ password }) {
	if (typeof password !== 'string' || password.length === 0) {
		return { valid: false, strength: null, error: 'Password is required' };
	}
	if (password.length < 8) {
		return { valid: false, strength: 'weak', error: 'Password must be at least 8 characters' };
	}
	const strength = password.length >= 12 ? 'strong' : 'medium';
	return { valid: true, strength };
}

function validateForm({ email, password }) {
	const emailResult    = validateEmail({ email });
	const passwordResult = validatePassword({ password });
	return {
		valid:  emailResult.valid && passwordResult.valid,
		errors: [
			...(emailResult.valid    ? [] : [emailResult.error]),
			...(passwordResult.valid ? [] : [passwordResult.error]),
		],
	};
}

module.exports = { validateEmail, validatePassword, validateForm };
