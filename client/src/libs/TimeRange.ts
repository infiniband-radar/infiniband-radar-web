import * as moment from 'moment';

export class TimeRange {
    public readonly from: moment.Moment;
    public readonly to: moment.Moment;

    public constructor(from: moment.Moment, to: moment.Moment) {
        this.from = from;
        this.to = to;
    }

    public isValid() {
        return this.from < this.to && this.from.isValid() && this.to.isValid();
    }

    public getDifference(): number {
        return this.to.diff(this.from);
    }

    /**
     * Tries to parse a TimeRange from an two strings
     * @param from
     * @param to
     * @returns {TimeRange} the time range
     * @throws {Error} when the timeRange is not valid
     */
    public static tryParse(from: string | number, to: string | number): TimeRange {
        const momentFrom = moment.unix(Number(from));
        const momentTo = moment.unix(Number(to));
        const timeRange = new TimeRange(momentFrom, momentTo);
        if (!timeRange.isValid()) {
            throw new Error(`Invalid time range from: '${from}' to: '${to}'`);
        }
        return timeRange;
    }
}
