const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimization: Exclude non-essential directories from the watch list to prevent EMFILE errors
config.resolver.blockList = [
    /node_modules\/.*\/node_modules\/.*/,
    /.*\.git\/.*/,
    /.*\.expo\/.*/,
    /.*\/\.git\/.*/,
    /.*\/\.expo\/.*/,
];

// Support for .mjs files often used by modern ESM packages like tslib
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Force Metro to resolve any tslib import to our local fix
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if ((moduleName === 'tslib' || moduleName.startsWith('tslib/')) &&
        context.originModulePath && !context.originModulePath.includes('tslib-fix.js')) {
        return {
            filePath: path.resolve(__dirname, 'tslib-fix.js'),
            type: 'sourceFile',
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

// Limit workers to 1 on Windows to prevent EMFILE errors
config.maxWorkers = 1;

module.exports = config;
