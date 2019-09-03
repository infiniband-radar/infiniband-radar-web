import {
    TopologyCa,
    TopologyConnection,
    TopologyHost,
    TopologyPort,
    TopologyRoot,
} from '../../../common/models/Client/TopologyTreeModels';
import { RawTopology, RawTopologyCa } from '../../../common/models/DataCollector/RawTopology';
import {HostType, RawHostTypeToEnum, RawLinkSpeedToDetails, RawNodeType} from '../../../common/models/AliasTypes';
import * as md5 from 'md5';

export class TopologyTreeBuilder {
    public static buildTopologyTree(rawTopology: RawTopology): TopologyRoot {
        const hostMap: {[hostname: string]: TopologyHost} = {};
        const connectionMap: {[connectionId: string]: TopologyConnection} = {};
        const caMap: {[caGuid: string]: TopologyCa} = {};

        for (const rawCa of rawTopology.cas) {
            const hostname = TopologyTreeBuilder.getHostname(rawCa);
            const type = RawHostTypeToEnum(rawCa.type as RawNodeType);
            const description = TopologyTreeBuilder.getCaDescription(type, rawCa);
            const subnetManager = rawCa.subnetManager;
            if (!hostMap[hostname]) {
                hostMap[hostname] = {
                    hostname,
                    type,
                    subnetManager,
                    cas: [],
                };
            }

            caMap[rawCa.guid] = {
                host: hostMap[hostname],
                caGuid: rawCa.guid,
                description,
                ports: [],
            };
            hostMap[hostname].cas.push(caMap[rawCa.guid]);
        }

        for (const rawPort of rawTopology.ports) {
            const port: TopologyPort = {
                ca: caMap[rawPort.caGuid],
                portNumber: rawPort.portNumber,
            };

            const connectionIdPartA = `${rawPort.caGuid}/${rawPort.portNumber}`;
            const connectionIdPartB = `${rawPort.toCaGuid}/${rawPort.toPortNumber}`;
            // Check if port is connected to something
            // and we just need one connection for two ports
            if (rawPort.speed && connectionIdPartA > connectionIdPartB) {
                const linkDetails = RawLinkSpeedToDetails(rawPort.speed);
                const possibleLinkDetails = RawLinkSpeedToDetails(rawPort.possibleSpeed);
                port.connection = {
                    connectionId: md5(`${connectionIdPartA}-${connectionIdPartB}`),
                    portA: port,
                    link: linkDetails,
                    possibleLink: possibleLinkDetails,
                } as TopologyConnection;
                connectionMap[port.connection.connectionId] = port.connection;
            }
            caMap[rawPort.caGuid].ports[rawPort.portNumber] = port;
        }

        for (const rawPort of rawTopology.ports) {
            if (rawPort.toCaGuid == null) {
                continue;
            }
            const ownPort = caMap[rawPort.caGuid].ports[rawPort.portNumber];
            const toPort = caMap[rawPort.toCaGuid].ports[rawPort.toPortNumber!];

            ownPort.toPort = toPort;

            if (ownPort.connection) {
                ownPort.connection.portB = toPort;
            } else if (toPort.connection) {
                toPort.connection.portB = ownPort;
            }
        }

        const hosts = Object.values(hostMap).sort((a, b) => a.hostname.localeCompare(b.hostname));
        const connections = Object.values(connectionMap).sort((a, b) => a.connectionId.localeCompare(b.connectionId));

        for (const connection of connections) {
            connection.portB.connection = connection;
        }

        return {
            hostMap,
            hosts,
            caMap,
            connectionMap,
            connections,
        };
    }

    private static getHostname(rawCa: RawTopologyCa) {
        return String(rawCa.description.split(' ')[0]).trim();
    }

    private static getCaDescription(type: HostType, rawCa: RawTopologyCa) {
        return type === HostType.Switch ? '(Switch)' : rawCa.description.split(' ')[1];
    }
}
