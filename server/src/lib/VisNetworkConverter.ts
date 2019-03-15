import { TopologyRoot } from '../../../common/models/Client/TopologyTreeModels';
import { VisDataModel, VisEdge, VisNode } from '../../../common/models/Client/VisDataModels';
import { HostType } from '../../../common/models/AliasTypes';

export class VisNetworkConverter {
    public static convertTopology(topology: TopologyRoot): VisDataModel {
        const nodes: VisNode[] = [];
        const edges: VisEdge[] = [];

        for (const host of topology.hosts) {
            nodes.push({
                id: host.hostname,
                label: host.hostname,
                shape: host.type === HostType.Switch ? 'circle' : 'box',
            });
        }


        for (const connection of topology.connections) {
            edges.push({
                id: connection.connectionId,
                from: connection.portA.ca.host.hostname,
                to: connection.portB.ca.host.hostname,
            });
        }

        return {
            nodes,
            edges,
        };
    }
}
