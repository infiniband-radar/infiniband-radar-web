//import { CaGuid, RawNodeType } from '../AliasTypes';
// TODO: caGuid fields must be of type 'CaGuid' but alias types are not _yet_ supported
// TODO: type fields must be of type 'RawNodeType'
// TODO: see: https://github.com/lukeautry/tsoa/issues/429

export interface RawTopologyCa {
    guid: string;
    description: string;
    type: string;
    subnetManager?: {
        state: string,
        priority: number,
    };
}

export interface RawTopologyPort {
    caGuid: string;
    portNumber: number;

    toCaGuid?: string;
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
