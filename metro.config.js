// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimization: Exclude non-essential directories from the watch list to prevent EMFILE errors
config.resolver.blockList = [
    /node_modules\/.*\/node_modules\/.*/,
    /\.git\/.*/,
    /\.expo\/.*/,
];

module.exports = config;
