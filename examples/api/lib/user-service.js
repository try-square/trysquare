'use strict';

async function getUser({ id, http, logger }) {
	logger(`fetching user ${id}`);
	const response = await http(`/users/${id}`);
	if (!response.ok) {
		throw new Error(`User ${id} not found (status ${response.status})`);
	}
	return response.body;
}

async function fetchWithRetry({ url, http, maxAttempts }) {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const response = await http(url);
		if (response.ok) return response.body;
		if (attempt === maxAttempts) {
			throw new Error(`Request to ${url} failed after ${maxAttempts} attempts`);
		}
	}
}

module.exports = { getUser, fetchWithRetry };
