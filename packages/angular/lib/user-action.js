'use strict';

// Creates a named user action for use with .andUser() on the chain.
// The execute function receives the Angular ComponentFixture and should interact
// with the component via the fixture or nativeElement.
//
// Usage:
//   const clicksSubmit = userAction('clicks submit', async (fixture) => {
//     fixture.nativeElement.querySelector('button[type="submit"]').click();
//     fixture.detectChanges();
//   });
//
//   when(mount(FormComponent))
//     .hasInputs(withInputs('empty form', {}))
//     .andUser(clicksSubmit)
//     .expect.behaviors(showsValidationErrors)
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
