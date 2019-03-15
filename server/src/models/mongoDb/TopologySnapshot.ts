import { VisPreRenderedPositions } from '../../../../common/models/Client/VisPreRenderdModels';
import { TopologyRoot } from '../../../../common/models/Client/TopologyTreeModels';
import { CircularJsonObject, FabricId } from '../../../../common/models/AliasTypes';

export interface TopologySnapshot {
    fabricId: FabricId;

    timestamp: number; // Unix timestamp

    topologyRoot: CircularJsonObject<TopologyRoot>; // Circular json object

    visPositions: VisPreRenderedPositions;
}
