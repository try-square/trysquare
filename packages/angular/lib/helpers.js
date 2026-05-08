'use strict';

// Creates a named input object carrying Angular @Input() property values.
// Applied to fixture.componentInstance before detectChanges() is called.
//
// Usage: when(mount(MyComponent)).hasInputs(withInputs('valid user', { userId: '123', role: 'admin' }))
function withInputs(name, inputs) {
	if (typeof name !== 'string' || !name) {
		throw new Error('withInputs requires a non-empty string name as the first argument.');
	}
	return { name, inputs: inputs || {} };
}

// Creates a named stub map compatible with the core .stubs() chain method.
//
// options.inject:  array of Angular provider objects — { provide: Token, useValue: mock }
//                  These are passed directly to TestBed.configureTestingModule({ providers }).
// options.imports: array of Angular modules to import in the TestBed config
//                  (e.g. ReactiveFormsModule, HttpClientTestingModule).
// options.schemas: array of Angular schemas (e.g. NO_ERRORS_SCHEMA) to suppress
//                  unknown-element errors for child components not under test.
//
// Usage:
//   withStubs('failing HTTP (503)', {
//     inject: [
//       { provide: HttpClient,     useValue: mockHttpClient({ status: 503 }) },
//       { provide: AuthService,    useValue: mockAuthService({ token: 'valid' }) },
//       { provide: LoggingService, useValue: mockLoggingService() },
//     ],
//     imports: [ReactiveFormsModule],
//   })
function withStubs(name, options) {
	if (typeof name !== 'string' || !name) {
		throw new Error('withStubs requires a non-empty string name as the first argument.');
	}
	const opts = options || {};
	return {
		name,
		inject:  Array.isArray(opts.inject)  ? opts.inject  : [],
		imports: Array.isArray(opts.imports) ? opts.imports : [],
		schemas: Array.isArray(opts.schemas) ? opts.schemas : [],
	};
}

module.exports = { withInputs, withStubs };
