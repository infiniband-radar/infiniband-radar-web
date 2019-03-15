//first check if bezier-js is already loaded in the browser window, if so,
// use this instance. Else, load via commonjs.
module.exports = (typeof window !== 'undefined') && window['bezier'] || require('bezier-js');
