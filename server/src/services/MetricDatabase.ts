import { AutoWired, Inject, Singleton } from 'typescript-ioc';
import { ConfigService } from './ConfigService';
import { Logger } from '../lib/Logger';
import { InfluxDB, ISchemaOptions, FieldType, IPoint, escape } from 'influx';
import { RawPortMetric } from '../../../common/models/DataCollector/RawPortMetric';
import { TopologyDatabase } from './TopologyDatabase';
import { ConnectionId, FabricId } from '../../../common/models/AliasTypes';
import { TopologyTreeUtils } from '../../../common/TopologyTreeUtils';
import { GlobalMetricData } from '../../../common/models/Client/MetricData';

const selfMonitoringSchemata: ISchemaOptions[] = [
    {
        measurement: 'api_response_time',
        tags: [
            'method',
            'path',
            'statusCode',
        ],
        fields: {
            timeMs: FieldType.INTEGER,
        },
    },
    {
        measurement: 'metric_time',
        tags: [
            'fabric',
        ],
        fields: {
            timeMs: FieldType.INTEGER,
        },
    },
    {
        measurement: 'topology_time',
        tags: [
            'fabric',
        ],
        fields: {
            fetchedFromFabricTimeMs: FieldType.INTEGER,
            optimizationIterations: FieldType.INTEGER,
            optimizationTimeMs: FieldType.INTEGER,
        },
    },
];

const portMetricsSchemata: ISchemaOptions[] = [
    {
        measurement: 'port_bandwidth',
        tags: [
            'fabric',
            'hostname',
            'caDescription',
            'portNumber',
            'connectionId',
            'connectionSide',
        ],
        fields: {
            xmit: FieldType.INTEGER,
            rcv: FieldType.INTEGER,
        },
    },
];

class SelfMonitoringDatabase {
    public constructor(private readonly influx: InfluxDB) {

    }

    public async writeApiResponseTime(method: string, path: string, statusCode: number, timeMs: number) {
        await this.influx.writeMeasurement('api_response_time', [{
            tags: {
                method,
                path,
                statusCode: String(statusCode),
            },
            fields: {
                timeMs,
            },
        }]);
    }

    public async writeTopologyTime(fabricId: FabricId,
                                   fetchedFromFabricTimeMs: number,
                                   optimizationIterations: number,
                                   optimizationTimeMs: number) {
        await this.influx.writeMeasurement('topology_optimization_time', [{
            tags: {
                fabricId,
            },
            fields: {
                fetchedFromFabricTimeMs,
                optimizationIterations,
                optimizationTimeMs,
            },
        }]);
    }
}

@Singleton
@AutoWired
export class MetricDatabase {
    public readonly selfMonitoring: SelfMonitoringDatabase;

    private static readonly log = Logger.getLogger(MetricDatabase);

    private static readonly CONNECTION_SIDE_A = 'A';
    private static readonly CONNECTION_SIDE_B = 'B';

    private static globalMetricResolutionInSec = 60 * 60; // 1 hour resolution
    private static globalMetricSecIntoPast = 60 * 60 * 24 * 14; // Last 14 days
    private static globalMetricSecReloadTime = 60 * 30; // 30 min

    @Inject
    private configService: ConfigService;

    @Inject
    private topologyDb: TopologyDatabase;

    private readonly config = this.configService.getInfluxDbConfig();

    private readonly influx: InfluxDB;


    private globalMetricCache: {[fabricId: string]: Promise<GlobalMetricData>} = {};

    public constructor() {
        const [host, port] = this.config.host.split(':');
        this.influx = new InfluxDB({
            host,
            port: Number(port) || undefined,
            schema: [...portMetricsSchemata, ...selfMonitoringSchemata], // Merge all schema arrays to one
            database: this.config.database,
        });
        this.selfMonitoring = new SelfMonitoringDatabase(this.influx);
    }

    public async setup() {
        await this.clusterAliveCheck();

        const databaseName = this.config.database;

        await this.influx.createDatabase(databaseName);
        MetricDatabase.log.info(`Created database '${databaseName}'`);

        const retentionName = 'rp_14d';
        MetricDatabase.log.info(`Creating retention policy '${retentionName}' for database '${databaseName}'`);
        await this.influx.createRetentionPolicy(retentionName, {
            database: databaseName,
            isDefault: true,
            duration: '14d', // Store data for 14 days
            replication: 1,
        });

        MetricDatabase.log.info(`Created retention policy '${retentionName}' for database '${databaseName}'`);

        for (const fabric of this.configService.getFabricConfigs()) {
            const fabricId = fabric.fabricId;
            this.globalMetricCache[fabricId] = new Promise(async (resolve) => {
                await this.updateGlobalMetricCache(fabricId);
                this.globalMetricCache[fabricId].then(resolve);
            });
        }
    }

    public getGlobalBandwidthMetric(fabricId: string): Promise<GlobalMetricData> {
        return this.globalMetricCache[fabricId];
    }

    public async getGlobalBandwidthUsage(fabricId: FabricId,
                                         resolutionInSec: number,
                                         howManySecIntoPast: number): Promise<any[]> {
        const query = MetricDatabase.createGetGlobalAggregatedBandwidthQuery(fabricId, resolutionInSec, howManySecIntoPast);
        return await this.influx.query(query);
    }

    public async getXmitForAllHosts(fabricId: string,
                                    resolutionInSec: number,
                                    fromTime: number,
                                    toTime: number,
    ): Promise<any[]> {
        const query = MetricDatabase.createGetXmitForAllHostsQuery(fabricId, resolutionInSec, fromTime, toTime);
        return await this.influx.query(query);
    }

    public async getBandwidthForAllConnectionsAsAverage(fabricId: string, fromTime: number, toTime: number): Promise<any[]> {
        const query = MetricDatabase.createGetBandwidthForAllConnectionsAsAverageQuery(fabricId, fromTime, toTime);
        return await this.influx.query(query);
    }

    public async getDataOfConnection(fabricId: string,
                                     connectionId: ConnectionId,
                                     resolutionInSec: number,
                                     fromTime: number,
                                     toTime: number): Promise<any[]> {

        const query = MetricDatabase.createGetDataOfConnectionQuery(
            fabricId,
            connectionId,
            resolutionInSec,
            fromTime,
            toTime,
        );

        return await this.influx.query(query);
    }

    public async getXmitAndRcvForAllPortsAtHost(fabricId: string,
                                                hostname: string,
                                                resolutionInSec: number,
                                                fromTime: number,
                                                toTime: number): Promise<any[]>  {
        const query = MetricDatabase.createGetXmitAndRcvForAllPortsAtHostQuery(
            fabricId,
            hostname,
            resolutionInSec,
            fromTime,
            toTime,
        );
        return await this.influx.query(query);
    }

    public async insertRawMetrics(fabricId: FabricId, rawMetrics: RawPortMetric[], dataCollectionTimeMs: number) {
        const topologyRoot = await this.topologyDb.getInternalLatestTopologyRoot(fabricId);
        if (!topologyRoot) {
            MetricDatabase.log.error(`Tried to insert metric for '${fabricId}' but there is not topology!`);
            return;
        }
        const points: IPoint[] = [];
        for (const rawMetric of rawMetrics) {
            const port = TopologyTreeUtils.getPortByCaAndNumber(topologyRoot, rawMetric.caGuid, rawMetric.portNumber);
            if (!port) {
                MetricDatabase.log.warn(`Cannot find port caGuid: '${rawMetric.caGuid}' portNum: ${rawMetric.portNumber}`);
                continue;
            }

            if (!port.connection) {
                MetricDatabase.log.warn(`Port caGuid: '${rawMetric.caGuid}' portNum: ${rawMetric.portNumber} is not connected`);
                continue;
            }

            points.push({
                measurement: 'port_bandwidth',
                tags: {
                    fabric: fabricId,
                    hostname: port.ca.host.hostname,
                    caDescription: port.ca.description,
                    portNumber: String(port.portNumber),
                    connectionId: port.connection.connectionId,
                    connectionSide: port.connection.portA === port ?
                        MetricDatabase.CONNECTION_SIDE_A : MetricDatabase.CONNECTION_SIDE_B,
                },
                fields: {
                    xmit: rawMetric.xmit,
                    rcv: rawMetric.rcv,
                },
            });
        }

        points.push({
            measurement: 'metric_time',
            tags: {
                fabric: fabricId,
            },
            fields: {
                timeMs: dataCollectionTimeMs,
            },
        });

        await this.influx.writePoints(points);
    }

    public async updateGlobalMetricCache(fabricId: FabricId) {
        try {
            MetricDatabase.log.info(`[${fabricId}] Updating global metric`);
            const globalBandwidthUsage = await this.getGlobalBandwidthUsage(
                fabricId,
                MetricDatabase.globalMetricResolutionInSec,
                MetricDatabase.globalMetricSecIntoPast,
            );

            if (!globalBandwidthUsage.length) {
                this.globalMetricCache[fabricId] = Promise.resolve({
                    startTimeStamp: 0,
                    secondsPerStep: 0,
                    data: [],
                });
                return;
            }

            const startTime = Math.floor(globalBandwidthUsage[0].time.getTime() / 1000);
            const clientData = [];

            for (const data of globalBandwidthUsage) {
                clientData.push(data.xmit);
            }

            this.globalMetricCache[fabricId] = Promise.resolve({
                startTimeStamp: startTime,
                secondsPerStep: MetricDatabase.globalMetricResolutionInSec,
                data: clientData,
            });
        } catch (e) {
            MetricDatabase.log.error(`[${fabricId}] An error occurred while updating global metric '${e.message}'`);
        }

        setTimeout(() => this.updateGlobalMetricCache(fabricId), MetricDatabase.globalMetricSecReloadTime * 1000);
    }

    private async clusterAliveCheck() {
        const pings = await this.influx.ping(2000);
        for (const ping of pings) {
            if (ping.online) {
                return;
            }
        }
        throw new Error('No InfluxDb host is available');
    }

    private static createGetGlobalAggregatedBandwidthQuery(fabricId: FabricId,
                                                           resolutionInSec: number,
                                                           howManySecIntoPast: number) {
        return `
            SELECT
                round(mean("xmit")) as xmit
            FROM "port_bandwidth"
            WHERE
                    ("fabric" = ${escape.stringLit(fabricId)})
                AND
                    time >= now() - ${howManySecIntoPast}s
            GROUP BY time(${resolutionInSec}s) fill(null)
               `;
    }

    private static createGetBandwidthForAllConnectionsAsAverageQuery(fabricId: FabricId, fromSec: number, toSec: number) {
        return `
            SELECT
                round(mean("rcv")) as rcv,
                round(mean("xmit")) as xmit
            FROM "port_bandwidth"
            WHERE
                    ("fabric" = ${escape.stringLit(fabricId)})
                AND
                    ("connectionSide" = ${escape.stringLit(MetricDatabase.CONNECTION_SIDE_A)})
                AND
                    time >= ${fromSec}s
                AND
                    time <= ${toSec}s
            GROUP BY
                "connectionId"
        `;
    }

    private static createGetXmitForAllHostsQuery(fabricId: FabricId, resolutionInSec: number, fromSec: number, toSec: number) {
        return `
            SELECT
                max("xmit") as xmit
            FROM "port_bandwidth"
            WHERE
                    ("fabric" = ${escape.stringLit(fabricId)})
                AND
                    time >= ${fromSec}s
                AND
                    time <= ${toSec}s
            GROUP BY
                time(${resolutionInSec}s),
                "hostname"
        `;
    }

    private static createGetXmitAndRcvForAllPortsAtHostQuery(fabricId: string,
                                                             hostname: string,
                                                             resolutionInSec: number,
                                                             fromSec: number,
                                                             toSec: number) {
        return `
            SELECT
                max("xmit") as xmit,
                max("rcv") as rcv
            FROM "port_bandwidth"
            WHERE
                    ("fabric" = ${escape.stringLit(fabricId)})
                AND
                    ("hostname" = ${escape.stringLit(hostname)})
                AND
                    time >= ${fromSec}s
                AND
                    time <= ${toSec}s
            GROUP BY
                time(${resolutionInSec}s),
                "caDescription",
                "portNumber"
        `;
    }

    private static createGetDataOfConnectionQuery(fabricId: string,
                                                  connectionId: ConnectionId,
                                                  resolutionInSec: number,
                                                  fromTime: number,
                                                  toTime: number) {
        return `
            SELECT
                max("xmit") as xmit,
                max("rcv") as rcv
            FROM "port_bandwidth"
            WHERE
                    ("fabric" = ${escape.stringLit(fabricId)})
                AND
                    ("connectionId" = ${escape.stringLit(connectionId)})
                AND
                    ("connectionSide" = ${escape.stringLit(MetricDatabase.CONNECTION_SIDE_A)})
                AND
                    time >= ${fromTime}s
                AND
                    time <= ${toTime}s
            GROUP BY
                time(${resolutionInSec}s)
        `;
    }

}
