import {ChangeOverview} from '../../../common/models/Client/ChangeOverviews';
import {GroupedChanges} from '@/libs/GroupedChanges';

export class ChangesGrouper {
    public static groupChanges(allChanges: ChangeOverview[]): GroupedChanges[] {

        const groupRange = 60 * 60 * 1000; // 60 min
        const result: GroupedChanges[] = [];

        const orderedTimestamps = Object.values(allChanges).map((c) => c.timestamp).sort();
        const changesByTimestamp: {[timestamp: number]: ChangeOverview} = {};
        for (const change of allChanges) {
            changesByTimestamp[change.timestamp] = change;
        }

        for (let i = 0; i < orderedTimestamps.length; i++) {
            let timestamp = orderedTimestamps[i];
            let totalTimestamp = timestamp;
            const changeOverviews: ChangeOverview[] = [];
            changeOverviews.push(changesByTimestamp[timestamp]);

            let diffToNext = orderedTimestamps[i + 1] - timestamp;
            while (diffToNext < groupRange) {
                i++;
                timestamp = orderedTimestamps[i];
                totalTimestamp += timestamp;
                changeOverviews.push(changesByTimestamp[timestamp]);
                diffToNext = orderedTimestamps[i + 1] - timestamp;
            }
            const groupTimestamp = Math.round(totalTimestamp / changeOverviews.length);
            result.push({
                groupTimestamp,
                changes: changeOverviews,
            });
        }

        return result;
    }
}
