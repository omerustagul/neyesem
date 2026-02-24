// tslib-fix.js
// Use an absolute-ish path or just pull from the actual node_modules directory 
// to avoid infinite recursion with the Metro resolver.
const tslib = require('./node_modules/tslib/tslib.js');

const patch = tslib;

// Ensure default exists and points to the module itself for ESM interop
if (!patch.default) {
    patch.default = patch;
}

// Signal that this is an ES module
patch.__esModule = true;

module.exports = patch;
module.exports.default = patch;
