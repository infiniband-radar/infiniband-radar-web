import {TimeRange} from '@/libs/TimeRange';
import {TimeUtils} from '@/libs/TimeUtils';
import * as moment from 'moment';

export class HumanTimeRange {
    public readonly from: string;
    public readonly to: string;

    public constructor(from: string | number, to: string | number) {
        this.from = String(from);
        this.to = String(to);
    }

    /**
     * Evaluates the human time range expression
     * @returns {TimeRange} A TimeRange with an relative offset of the time that the function is called
     */
    public evaluate(): TimeRange {
        return new TimeRange(TimeUtils.fromHumanRelativTime(this.from), TimeUtils.fromHumanRelativTime(this.to));
    }

    /**
     * Evaluates and converts the current object to a human readable description.
     * e.g.
     *  {from: 'now-5m', to: 'now'} => 'Last 5 minutes'
     *  {from: '156423578', to: '159663578'} => '156423578 to 159663578'
     * @returns {String} The human readable description
     */
    public toHumanDescription(): string {
        const timeRange = this.evaluate();
        if (this.to === 'now') {
            return `Last ${moment.duration(moment(timeRange.to).diff(timeRange.from)).humanize()}`;
        }
        return this.from + ' to ' + this.to;
    }

    public copy(): HumanTimeRange {
        return new HumanTimeRange(this.from, this.to);
    }
}
