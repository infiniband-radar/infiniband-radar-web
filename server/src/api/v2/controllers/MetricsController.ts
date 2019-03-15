import { Body, Controller, Get, Path, Put, Query, Response, Route, Security } from 'tsoa';
import { Inject } from 'typescript-ioc';
import { RawMetric } from '../../../../../common/models/DataCollector/RawMetric';
import { MetricDatabase } from '../../../services/MetricDatabase';
import { VisPreRenderedColors } from '../../../../../common/models/Client/VisPreRenderdModels';
import {
    ConnectionMetricDataModel,
    HostMetricData,
    MetricDataBody, RawFlotMetric, SeriesToCaPort,
    SingleMetricData,
} from '../../../../../common/models/Client/MetricData';
import { ApiValidationHelper } from '../ApiValidationHelper';
import { ColorGradient } from '../../../../../common/ColorGradient';
import { TopologyDatabase } from '../../../services/TopologyDatabase';
import { Logger } from '../../../lib/Logger';

@Route('v2/metrics')
export class MetricsController extends Controller {

    private static log = Logger.getLogger(MetricsController);
    private static resolutionMinTimeRange = 5;
    private static resolutionMaxNumberOfPoints = 50;

    @Inject
    private metricDb: MetricDatabase;

    @Inject
    private toplogyDb: TopologyDatabase;

    @Security('user')
    @Response(400, 'Bad Request')
    @Get('{fabricId}/connection/{connectionId}')
    public async getConnectionMetric(@Path('fabricId') fabricId: string,
                                     @Path('connectionId') connectionId: string,
                                     @Query() fromTime: number,
                                     @Query() toTime: number,
    ): Promise<MetricDataBody<ConnectionMetricDataModel>> {
        ApiValidationHelper.ensureValidFabricId(fabricId);

        const resolutionInSec = MetricsController.getSaneResolution(fromTime, toTime);

        const connectionSidesMetrics = await this.metricDb.getDataOfConnection(
            fabricId,
            connectionId,
            resolutionInSec,
            fromTime,
            toTime,
        );

        const sideA = [];
        const sideB = [];

        const startTimeStamp = Math.floor(connectionSidesMetrics[0].time.getTime() / 1000);

        const clientData = [];

        for (const data of connectionSidesMetrics) {
            sideA.push(data.xmit);
            sideB.push(data.rcv);
        }

        return {
            startTimeStamp,
            secondsPerStep: resolutionInSec,
            data: {
                portA: sideA,
                portB: sideB,
            },
        };
    }


    @Security('user')
    @Response(400, 'Bad Request')
    @Get('{fabricId}/visColors')
    public async getVisColors(@Path('fabricId') fabricId: string,
                              @Query() fromTime: number,
                              @Query() toTime: number,
    ): Promise<VisPreRenderedColors> {
        ApiValidationHelper.ensureValidFabricId(fabricId);

        const usageByConnection = await this.metricDb.getBandwidthForAllConnectionsAsAverage(fabricId, fromTime, toTime);

        const colors: VisPreRenderedColors = {};

        const connectionMap = this.toplogyDb.getInternalLatestTopologyRoot(fabricId).connectionMap;
        for (const usage of usageByConnection) {
            const connection = connectionMap[usage.connectionId];
            if (!connection) {
                MetricsController.log.error(`[getAllHostMetrics] Connection could not be found '${usage.connectionId}'`);
                continue;
            }
            const color = ColorGradient.getColorForConnection(connection, usage.xmit, usage.rcv);
            colors[connection.connectionId] = {
                portA: color.xmitColor,
                portB: color.rcvColor,
            };
        }


        /*
        const lowResolutionMetricsData = {};

        const usageByHost = await this.metricDb.getXmitForAllHosts(fabricId, resolution, fromTime, toTime);
        const startTime = Math.ceil(usageByHost[0].time.getTime() / 1000);
        for (const data of usageByHost) {
            if (!lowResolutionMetricsData[data.hostname]) {
                lowResolutionMetricsData[data.hostname] = [];
            }
            lowResolutionMetricsData[data.hostname].push(data.xmit);
        }

        const lowResolutionMetrics: MetricDataBody<AllHostsMetricData> = {
            startTimeStamp: startTime,
            secondsPerStep: resolution,
            data: lowResolutionMetricsData,
        };

        {
            visColors: ,
            lowResolutionMetrics: null,
        };
        */

        return colors;
    }

    @Security('user')
    @Response(400, 'Bad Request')
    @Get('{fabricId}/global')
    public async getGlobalMetric(@Path('fabricId') fabricId: string): Promise<MetricDataBody<SingleMetricData>> {
        ApiValidationHelper.ensureValidFabricId(fabricId);

        return await this.metricDb.getGlobalBandwidthMetric(fabricId);
    }

    @Security('user')
    @Response(400, 'Bad Request')
    @Get('{fabricId}/{hostname}')
    public async getHostMetric(@Path('fabricId') fabricId: string,
                               @Path('hostname') hostname: string,
                               @Query() fromTime: number,
                               @Query() toTime: number,
    ): Promise<HostMetricData> {
        ApiValidationHelper.ensureValidFabricId(fabricId);

        const resolutionInSec = MetricsController.getSaneResolution(fromTime, toTime);

        const dataPoints = await this.metricDb.getXmitAndRcvForAllPortsAtHost(
            fabricId,
            hostname,
            resolutionInSec,
            fromTime,
            toTime,
        );

        const xmitDataPoints: RawFlotMetric = [];
        const rcvDataPoints: RawFlotMetric = [];
        let nextFreeIndex = 0;

        const tmpCaPortToIndexMap: {[caDescription: string]: number[]} = {};

        for (const dataPoint of dataPoints) {
            const portNumber = Number(dataPoint.portNumber);
            if (!tmpCaPortToIndexMap[dataPoint.caDescription]) {
                tmpCaPortToIndexMap[dataPoint.caDescription] = [];
            }
            if (!tmpCaPortToIndexMap[dataPoint.caDescription][portNumber]) {
                const newIndex = nextFreeIndex++;
                xmitDataPoints[newIndex] = [];
                rcvDataPoints[newIndex] = [];
                tmpCaPortToIndexMap[dataPoint.caDescription][portNumber] = newIndex;
            }
            const index = tmpCaPortToIndexMap[dataPoint.caDescription][portNumber];

            const msTimeStamp = dataPoint.time.getTime();

            // Skip null values - Is allowed here since we are sending the timeStamp too

            if (dataPoint.xmit) {
                xmitDataPoints[index].push([msTimeStamp, dataPoint.xmit]);
            }

            if (dataPoint.rcv) {
                rcvDataPoints[index].push([msTimeStamp, dataPoint.rcv]);
            }
        }

        const seriesToCaPort: SeriesToCaPort = Array(nextFreeIndex);

        for (const caDescription of Object.keys(tmpCaPortToIndexMap)) {
            for (const portNumber of Object.keys(tmpCaPortToIndexMap[caDescription])) {
                const index = tmpCaPortToIndexMap[caDescription][portNumber];
                seriesToCaPort[index] = {
                    caDescription,
                    portNumber: (portNumber as any) as number,
                };
            }
        }

        return {
            xmit: xmitDataPoints,
            rcv: rcvDataPoints,
            seriesToCaPort,
        };
        // throw new Error('Not yet implemented');
    }

    @Security('staticToken')
    @Response(400, 'Bad Request')
    @Put('{fabricId}')
    public async insertFabricMetric(@Path('fabricId') fabricId: string, @Body() metric: RawMetric) {
        ApiValidationHelper.ensureValidFabricId(fabricId);
        await this.metricDb.insertRawMetrics(fabricId, metric.metrics, metric.timeTookMs);
    }

    private static getSaneResolution(fromTime: number, toTime: number): number {
        const timeRange = toTime - fromTime;

        return Math.ceil(Math.max(
            timeRange / MetricsController.resolutionMaxNumberOfPoints,
            MetricsController.resolutionMinTimeRange,
        ));
    }
}
