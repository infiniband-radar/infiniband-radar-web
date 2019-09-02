import {FabricId} from '../AliasTypes';

export interface FabricModel {
    fabricId: FabricId;
    name: string;
    image: string;
    hideFromInitialSelection: boolean;
}
