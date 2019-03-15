import { RawPortMetric } from './RawPortMetric';

export interface RawMetric {
    metrics: RawPortMetric[];
    timeTookMs: number;
}
