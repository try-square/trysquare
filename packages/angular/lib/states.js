'use strict';

// Lifecycle state constants for Angular components.
// Pass to .inState() on the when() chain.
// setupAngularRunner() uses these to determine what Angular lifecycle to trigger before specs run.
//
// created:     fixture created, no detectChanges — component is in pre-init state
// ngOnInit:    detectChanges() called once — triggers ngOnChanges + ngOnInit (default when omitted)
// ngOnChanges: inputs changed + detectChanges() called — exercises the change detection path
// ngOnDestroy: detectChanges() then fixture.destroy() — exercises cleanup logic
const states = {
	created:     Object.freeze({ name: 'created' }),
	ngOnInit:    Object.freeze({ name: 'ngOnInit' }),
	ngOnChanges: Object.freeze({ name: 'ngOnChanges' }),
	ngOnDestroy: Object.freeze({ name: 'ngOnDestroy' }),
};

module.exports = { states };
