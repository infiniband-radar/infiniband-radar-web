import { ChangeOverview, ChangeOverviewDetails } from './models/Client/ChangeOverviews';
import { ChangeEntry, ChangeTypeCategory, ChangeTypeStatus, changeTypeToStatus } from './models/Client/ChangeEntry';

export class ChangeOverviewCounter {
    public static generateOverview(timestamp: number, entries: ChangeEntry[]): ChangeOverview {
        const details = this.generateOverviewDetails(entries);
        return {
            timestamp,
            [ChangeTypeCategory.Host]: details.host,
            [ChangeTypeCategory.Connection]: details.connection,
        };
    }

    public static generateOverviewDetails(entries: ChangeEntry[]):
        {host: ChangeOverviewDetails, connection: ChangeOverviewDetails}  {
        const result: {host: ChangeOverviewDetails, connection: ChangeOverviewDetails} = {
            [ChangeTypeCategory.Host]: {
                [ChangeTypeStatus.Added]: 0,
                [ChangeTypeStatus.Modified]: 0,
                [ChangeTypeStatus.Removed]: 0,
            },
            [ChangeTypeCategory.Connection]: {
                [ChangeTypeStatus.Added]: 0,
                [ChangeTypeStatus.Modified]: 0,
                [ChangeTypeStatus.Removed]: 0,
            },
        };

        // @ts-ignore
        for (const entry of entries) {
            const mapped = changeTypeToStatus[entry.changeType];
            result[mapped.category][mapped.status]++;
        }

        return result;
    }

    public static containsOverviewChanges(overview: ChangeOverview): boolean {
        return this.containsChanges(overview.host, overview.connection);
    }

    public static containsChanges(...overviewDetails: ChangeOverviewDetails[]): boolean {
        for (const detail of overviewDetails) {
            if (detail.added || detail.modified || detail.removed) {
                return true;
            }
        }
        return false;
    }
}
