import * as moment from 'moment';
const relativeTimeParser = require('relative-time-parser');

export class TimeUtils {
    private static readonly nowKeyword = 'now';

    /**
     * Converts a relative time string to an unix timestamp
     * example: 'now - 5s' => 153423456
     * @param {string} input
     * @returns {moment.Moment} Moment object with parsed time
     */
    public static fromHumanRelativTime(input: string): moment.Moment {
        let realRelativeTime = input.replace(/\s/g, '');
        if (!relativeTimeParser().isRelativeTimeFormat(realRelativeTime)) {
            return moment.unix(Number(realRelativeTime));
        }

        const nowPosition = realRelativeTime.indexOf(TimeUtils.nowKeyword);
        const backupRealRelativeTime = input;
        if (nowPosition === 0) {
            realRelativeTime = realRelativeTime.substring(nowPosition + TimeUtils.nowKeyword.length);
        }

        if (realRelativeTime === '') {
            realRelativeTime = backupRealRelativeTime;
        }

        return relativeTimeParser().relativeTime(realRelativeTime);
    }
}
