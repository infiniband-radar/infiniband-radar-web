export type SingleMetricData = number[/* index */]; // == value
export type RawFlotMetric = number[/* portNumber / series */][/* index */][/* timestamp, value */];

export interface SeriesToCaPortEntry {
    caDescription: string;
    portNumber: number;
}

export type SeriesToCaPort = SeriesToCaPortEntry[];

interface HostMetricDataModel {
    xmit: RawFlotMetric;
    rcv: RawFlotMetric;
    seriesToCaPort: SeriesToCaPort;
}

export interface ConnectionMetricDataModel {
    portA: SingleMetricData;
    portB: SingleMetricData;
}


// TODO: DEPRECATED ?
export interface AllHostsMetricData {
    [hostname: string]: SingleMetricData;
}

export interface MetricDataBody<T> {
    startTimeStamp: number; // unix timestamp
    secondsPerStep: number;

    data: T;
}

export type HostMetricData = HostMetricDataModel;
export type ConnectionMetricData = MetricDataBody<ConnectionMetricDataModel>;
export type GlobalMetricData = MetricDataBody<SingleMetricData>;
