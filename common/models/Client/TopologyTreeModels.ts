import {CaGuid, ConnectionId, HostType, LinkDetails} from '../AliasTypes';

export type SelectableTopologyElement =
    TopologyHost |
    TopologyConnection;

export type TopologyElement =
    TopologyHost |
    TopologyCa |
    TopologyPort |
    TopologyConnection;

export interface SubnetManagerState {
    state: string;
    priority: number;
}

export interface TopologyConnection {
    connectionId: ConnectionId;
    portA: TopologyPort;
    portB: TopologyPort;
    link: LinkDetails;
    possibleLink: LinkDetails;
}

export interface TopologyPort {
    portNumber: number;
    ca: TopologyCa;
    toPort?: TopologyPort;
    connection?: TopologyConnection;
}

export interface TopologyCa {
    host: TopologyHost;
    description: string;
    caGuid: CaGuid;

    // INDEX = portNumber
    ports: TopologyPort[];
}

export interface TopologyHost {
    hostname: string;
    type: HostType;
    cas: TopologyCa[];
    subnetManager?: SubnetManagerState;
}

export interface TopologyRoot {
    hostMap: {[hostname: string]: TopologyHost};
    hosts: TopologyHost[];
    caMap: {[caGuid: string]: TopologyCa};
    connectionMap: {[connectionId: string]: TopologyConnection};
    connections: TopologyConnection[];
}
