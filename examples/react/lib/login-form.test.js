'use strict';

const assert = require('node:assert/strict');
const { fireEvent } = require('@testing-library/react');
const { when }      = require('@trysquare/core');
const { mount, withProps, userAction, states } = require('@trysquare/react');
const { spy, wasCalledOnce, wasCalledWith, wasNotCalled } = require('@trysquare/matchers');
const { LoginForm } = require('./login-form');

// ── Static rendering ──────────────────────────────────────────────────────────

function showsSignInButton(screen) {
	screen.getByRole('button', { name: 'Sign in' });
}

function showsEmailInput(screen) {
	screen.getByRole('textbox', { name: 'Email' });
}

function showsNoError(screen) {
	assert.strictEqual(screen.queryByRole('alert'), null);
}

when(mount(LoginForm))
	.hasInputs(withProps('default state', {}))
	.expect.output(showsSignInButton, showsEmailInput, showsNoError)
	.assert();

// ── Invalid email shows error ─────────────────────────────────────────────────

const submitsInvalidEmail = userAction('submits with invalid email', async (screen) => {
	fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
		target: { value: 'notanemail' },
	});
	fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));
});

function showsEmailError(screen) {
	const alert = screen.getByRole('alert');
	assert.strictEqual(alert.textContent, 'Invalid email address');
}

when(mount(LoginForm))
	.hasInputs(withProps('default state', {}))
	.andUser(submitsInvalidEmail)
	.expect.behaviors(showsEmailError)
	.assert();

// ── Short password shows error ────────────────────────────────────────────────

const submitsShortPassword = userAction('submits with short password', async (screen) => {
	fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
		target: { value: 'user@example.com' },
	});
	fireEvent.change(screen.getByLabelText('Password'), {
		target: { value: 'short' },
	});
	fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));
});

function showsPasswordError(screen) {
	const alert = screen.getByRole('alert');
	assert.strictEqual(alert.textContent, 'Password must be at least 8 characters');
}

when(mount(LoginForm))
	.hasInputs(withProps('default state', {}))
	.andUser(submitsShortPassword)
	.expect.behaviors(showsPasswordError)
	.assert();

// ── Valid submission calls onSubmit spy ───────────────────────────────────────

const mockSubmit = spy('form onSubmit');

const submitsValidCredentials = userAction('submits valid credentials', async (screen) => {
	fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
		target: { value: 'alice@example.com' },
	});
	fireEvent.change(screen.getByLabelText('Password'), {
		target: { value: 'supersecure' },
	});
	fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
});

function callsOnSubmit(screen) {
	wasCalledOnce(mockSubmit).assert(screen);
}

function submitsWithCorrectData(screen) {
	wasCalledWith(mockSubmit, [{ email: 'alice@example.com', password: 'supersecure' }]).assert(screen);
}

function showsNoErrorAfterSuccess(screen) {
	assert.strictEqual(screen.queryByRole('alert'), null);
}

when(mount(LoginForm))
	.hasInputs(withProps('with onSubmit handler', { onSubmit: mockSubmit }))
	.andUser(submitsValidCredentials)
	.expect.behaviors(callsOnSubmit, submitsWithCorrectData, showsNoErrorAfterSuccess)
	.assert();
