'use strict';

// Sets up a jsdom-backed global DOM environment so @testing-library/react
// can render React components in Node.js without a browser.
require('global-jsdom/register');

// React 18 act() requires this flag in non-Jest environments.
global.IS_REACT_ACT_ENVIRONMENT = true;
