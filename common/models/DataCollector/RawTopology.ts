import { CaGuid, RawNodeType } from '../AliasTypes';

export interface RawTopologyCa {
    guid: CaGuid;
    description: string;
    type: RawNodeType;
    subnetManager?: {
        state: string,
        priority: number,
    };
}

export interface RawTopologyPort {
    caGuid: CaGuid;
    portNumber: number;

    toCaGuid?: CaGuid;
    toPortNumber?: number;

    speed?: string;
    possibleSpeed?: string;
}

export interface RawTopology {
    cas: RawTopologyCa[];
    ports: RawTopologyPort[];

    discoveryTimeMs: number;
    writeJsonTimeMs: number;
}
