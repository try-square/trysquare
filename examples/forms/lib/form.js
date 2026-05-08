'use strict';

const { validateForm } = require('./validator');

function submitForm({ email, password, api, analytics, logger }) {
	logger('form submission started');
	analytics('form_submit_attempt', { email });

	const validation = validateForm({ email, password });
	if (!validation.valid) {
		analytics('form_validation_failed', { errors: validation.errors });
		return { success: false, errors: validation.errors };
	}

	const result = api.post('/auth/register', { email, password });
	analytics('form_submit_success', { email });
	logger('form submission completed');
	return result;
}

module.exports = { submitForm };
