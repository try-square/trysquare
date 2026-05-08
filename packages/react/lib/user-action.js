'use strict';

// Creates a named user action for use with .andUser() on the chain.
// The execute function receives the RTL render result and should use @testing-library/user-event
// to interact with the rendered component.
//
// Usage:
//   const clicksSubmit = userAction('clicks submit', async ({ getByRole }) => {
//     const userEvent = require('@testing-library/user-event');
//     await userEvent.setup().click(getByRole('button', { name: 'Submit' }));
//   });
//
//   when(mount(Form))
//     .hasInputs(withProps('form props', { action: '/submit' }))
//     .andUser(clicksSubmit)
//     .expect.output(showsConfirmation)
//     .assert();
function userAction(name, execute) {
	if (typeof name !== 'string' || !name) {
		throw new Error('userAction requires a non-empty string name as the first argument.');
	}
	if (typeof execute !== 'function') {
		throw new Error(
			`userAction '${name}' requires an execute function as the second argument.`
		);
	}
	return { name, execute };
}

module.exports = { userAction };
