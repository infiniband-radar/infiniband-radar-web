import { VisPreRenderedPositions } from '../VisPreRenderdModels';
import { CircularJsonObject } from '../../AliasTypes';
import { TopologyRoot } from '../TopologyTreeModels';
import { VisDataModel } from '../VisDataModels';

export interface GetTopologyResponse {
    timestamp: number; // Unix timestamp
    visPositions: VisPreRenderedPositions;
    visData: VisDataModel;
    topology: CircularJsonObject<TopologyRoot>;
}
