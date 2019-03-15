import {ChangeOverview} from '../../../common/models/Client/ChangeOverviews';

export interface GroupedChanges {
    groupTimestamp: number;
    changes: ChangeOverview[];
}
