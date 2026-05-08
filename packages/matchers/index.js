'use strict';

const { equals, deepEquals }                                                    = require('./lib/equality');
const { includes, hasProperty }                                                 = require('./lib/structure');
const { isType, isNull, isDefined }                                             = require('./lib/type');
const { matches }                                                               = require('./lib/pattern');
const { spy, returns, functionCall, wasCalled, wasCalledOnce, wasCalledTimes,
        wasCalledWith, wasNotCalled, wasCalledBefore, wasCalledAfter,
        wasCalledFirst, wasCalledLast }                                        = require('./lib/spy');

module.exports = {
	equals, deepEquals,
	includes, hasProperty,
	isType, isNull, isDefined,
	matches,
	spy, returns,
	functionCall, wasCalled, wasCalledOnce, wasCalledTimes, wasCalledWith, wasNotCalled,
	wasCalledBefore, wasCalledAfter, wasCalledFirst, wasCalledLast,
};
