const vis = require('../../../common/3dparty/vis/dist/vis.js');
const options = require('../../../common/VisNetworkOptions');

module.exports = function topologyOptimizerThread(visData) {

    return new Promise((resolve) => {
        const network = new vis.Network(undefined, visData, options);

        network.once('stabilizationIterationsDone', () => {
            const visPositions = {};
            const nodes = network.body.nodes;
            for (const nodeId of Object.keys(nodes)) {
                const node = nodes[nodeId];
                visPositions[nodeId] = {
                    x: node.x,
                    y: node.y,
                };
            }
            resolve({
                visPositions,
                iterations: 1, // legacy. Was available when 'stabilized' was used, but now we are using 'stabilizationIterationsDone'
            });
        });
    });
};
