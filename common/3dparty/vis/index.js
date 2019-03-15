const util = require('./lib/util');

try {
    // Only display this message in the browser
    if (window) {
        console.log(
            '%cInfiniBand Radar%c is using a custom build of the vis.js framework %o',
            'background: rgb(115, 188, 251); color: black;',
            '',
            'https://github.com/almende/vis'
        );
    }
}
catch (e) {
    // window is not defined on headless server
}

// Graph3d
//util.extend(exports, require('./index-graph3d'));

// Timeline & Graph2d
//util.extend(exports, require('./index-timeline-graph2d'));

// Network
util.extend(exports, require('./index-network'));
