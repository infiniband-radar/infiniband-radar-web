import {
    ConnectionMetricData,
    GlobalMetricData,
    HostMetricData,
    SeriesToCaPort,
    SingleMetricData,
} from '../../../common/models/Client/MetricData';

export type FlotSingleMetric = number[/* index */][/* timestamp, value */];
export type FlotMetricGroup = FlotSingleMetric[/* series */];

export type FlotGlobalMetric = FlotMetricGroup;
export interface FlotHostMetric {
    xmit: FlotMetricGroup;
    rcv: FlotMetricGroup;
    seriesToCaPort: SeriesToCaPort;
}
export interface FlotConnectionMetric {
    portA: FlotMetricGroup;
    portB: FlotMetricGroup;
}

export class FlotDataConverter {

    public static convertGlobalMetric(globalMetricData: GlobalMetricData): FlotGlobalMetric {
        return [FlotDataConverter.convertToFlotFormat(
            globalMetricData.startTimeStamp,
            globalMetricData.secondsPerStep,
            globalMetricData.data,
        )];
    }

    public static convertHostMetric(hostMetricData: HostMetricData): FlotHostMetric {
        return hostMetricData;
    }

    public static convertConnectionMetric(connectionMetricData: ConnectionMetricData): FlotConnectionMetric {

        function innerConvert(data: SingleMetricData) {
            return [FlotDataConverter.convertToFlotFormat(
                connectionMetricData.startTimeStamp,
                connectionMetricData.secondsPerStep,
                data,
            )];
        }

        return {
            portA: innerConvert(connectionMetricData.data.portA),
            portB: innerConvert(connectionMetricData.data.portB),
        };
    }

    private static convertToFlotFormat(startTimeStamp: number,
                                       secondsPerStep: number,
                                       values: SingleMetricData,
    ): FlotSingleMetric {
        const data = [];
        const msPerStep = secondsPerStep * 1000;
        let time = startTimeStamp * 1000;

        for (const value of values) {
            if (value) {
                data.push([time, value]);
            }
            time += msPerStep;
        }

        return data;
    }
}
