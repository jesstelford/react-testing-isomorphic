var jsdom = require('jsdom');

// Simulating a server-side rendered component
// This was obtained via React.renderToString()
// Store this DOM and the window in global scope ready for React to access
global.document = jsdom.jsdom('<!doctype html><html><body><label data-reactid=".e8wbttvlkw" data-react-checksum="-1336527625"><input type="checkbox" data-reactid=".e8wbttvlkw.0"><span data-reactid=".e8wbttvlkw.1">Write Tutorial</span></label></body></html>');
global.window = document.parentWindow;
