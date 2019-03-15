import { SubnetManagerState, TopologyRoot } from '../../../common/models/Client/TopologyTreeModels';
import { ChangedConnectionEntry, ChangedLinkTypeEntry, ChangeEntry, ChangeType } from '../../../common/models/Client/ChangeEntry';
import { LinkDetails } from '../../../common/models/AliasTypes';

export class TopologyChangeDetector {

    public static detectChanges(right: TopologyRoot, left?: TopologyRoot):
        {changes: ChangeEntry[], rerenderRequired: boolean} {
        const changes: ChangeEntry[] = [];
        let rerenderRequired = false;

        const hostnames: Iterable<string> = left ?
                new Set([...Object.keys(right.hostMap), ...Object.keys(left.hostMap)]).values() :
                new Set([...Object.keys(right.hostMap)]).values();

        for (const connectionId of Object.keys(right.connectionMap)) {
            if (!left || !left.connectionMap[connectionId]) {
                const connection = right.connectionMap[connectionId];
                const { portA, portB } = connection;
                changes.push({
                    changeType: ChangeType.ConnectionAdded,
                    portAHostname: portA.ca.host.hostname,
                    portACaDesc: portA.ca.description,
                    portAPort: portA.portNumber,
                    portBHostname: portB.ca.host.hostname,
                    portBCaDesc: portB.ca.description,
                    portBPort: portB.portNumber,
                    link: connection.link,
                } as ChangedConnectionEntry);
                rerenderRequired = true;
            } else if (
                !TopologyChangeDetector.compareLinkDetails(
                    right.connectionMap[connectionId].link,
                    left.connectionMap[connectionId].link)
            ) {
                const connection = right.connectionMap[connectionId];
                const { portA, portB } = connection;

                changes.push({
                    changeType: ChangeType.LinkTypeChanged,
                    portAHostname: portA.ca.host.hostname,
                    portACaDesc: portA.ca.description,
                    portAPort: portA.portNumber,
                    portBHostname: portB.ca.host.hostname,
                    portBCaDesc: portB.ca.description,
                    portBPort: portB.portNumber,
                    link: left.connectionMap[connectionId].link,
                    newLink: right.connectionMap[connectionId].link,
                } as ChangedLinkTypeEntry);
            }
        }

        for (const hostname of Object.keys(right.hostMap)) {
            if (!left || !left.hostMap[hostname]) {
                changes.push({
                    changeType: ChangeType.HostAdded,
                    hostname,
                    smState: right.hostMap[hostname].subnetManager,
                });
                rerenderRequired = true;
            }
        }

        if (left) {
            for (const connectionId of Object.keys(left.connectionMap)) {
                if (!right.connectionMap[connectionId]) {
                    const connection = left.connectionMap[connectionId];
                    const { portA, portB } = connection;
                    changes.push({
                        changeType: ChangeType.ConnectionRemoved,
                        portAHostname: portA.ca.host.hostname,
                        portACaDesc: portA.ca.description,
                        portAPort: portA.portNumber,
                        portBHostname: portB.ca.host.hostname,
                        portBCaDesc: portB.ca.description,
                        portBPort: portB.portNumber,
                        link: connection.link,
                    });
                    rerenderRequired = true;
                }
            }

            for (const hostname of Object.keys(left.hostMap)) {
                if (!right.hostMap[hostname]) {
                    changes.push({
                        changeType: ChangeType.HostRemoved,
                        hostname,
                    });
                    rerenderRequired = true;
                }
            }
        }

        for (const hostname of hostnames) {
            const oldHost = left ? left.hostMap[hostname] : undefined;
            const smState = oldHost ? left.hostMap[hostname].subnetManager : undefined;
            const newHost = right.hostMap[hostname];
            const newSmState = newHost ? newHost.subnetManager : undefined;

            if (!TopologyChangeDetector.compareSubnetManagerState(smState, newSmState)) {
                changes.push({
                    changeType: ChangeType.SubnetManagerStateChanged,
                    hostname,
                    smState,
                    newSmState,
                });
                rerenderRequired = true;
            }
        }

        return {
            changes,
            rerenderRequired,
        };
    }

    /**
     * Compares two SubnetManagerStates. Will return true if same.
     * @param a
     * @param b
     */
    private static compareSubnetManagerState(a?: SubnetManagerState, b?: SubnetManagerState): boolean {
        if (a && b) {
            return a.state === b.state && a.priority === b.priority;
        }

        return a === b;
    }

    /**
     * Compares two LinkDetails. Will return true if same.
     * @param a
     * @param b
     */
    private static compareLinkDetails(a: LinkDetails, b: LinkDetails): boolean {
        return a.linkType === b.linkType && a.linkWidth === b.linkWidth;
    }
}

