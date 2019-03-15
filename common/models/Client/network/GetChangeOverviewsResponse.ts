import { ChangeOverview } from '../ChangeOverviews';

export interface GetVersionChangeOverviewsResponse {
    defaultTimestamp: number;
    changes: ChangeOverview[];
}
