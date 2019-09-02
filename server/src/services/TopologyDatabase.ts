import { AutoWired, Inject, Singleton } from 'typescript-ioc';
import { ConfigService } from './ConfigService';
import { Collection, Db, MongoClient } from 'mongodb';
import { Logger } from '../lib/Logger';
import { TopologySnapshot } from '../models/mongoDb/TopologySnapshot';
import { FabricId } from '../../../common/models/AliasTypes';
import { TopologyRoot } from '../../../common/models/Client/TopologyTreeModels';
import * as CircularJson from 'circular-json';
import { VisPreRenderedPositions } from '../../../common/models/Client/VisPreRenderdModels';
import { ChangeEntry, ChangeType } from '../../../common/models/Client/ChangeEntry';
import { TopologyChangeDetector } from '../lib/TopologyChangeDetector';
import { ChangeOverview } from '../../../common/models/Client/ChangeOverviews';
import { ChangeOverviewCounter } from '../../../common/ChangeOverviewCounter';
import { ApiError } from '../api/ApiError';
import { SingletonTopologyDefaultTimestamp } from '../models/mongoDb/SingletonTopologyDefaultTimestamp';

@Singleton
@AutoWired
export class TopologyDatabase {
    private static readonly log = Logger.getLogger(TopologyDatabase);

    @Inject
    private configService: ConfigService;

    private config = this.configService.getMongoDbConfig();
    private fabricConfigs = this.configService.getFabricConfigs();

    private client: MongoClient;
    private db: Db;
    private topologySnapshotCollection: Collection<TopologySnapshot>;
    private topologyDefaultTimestampCollection: Collection<SingletonTopologyDefaultTimestamp>;

    private cachedLatestTopologyRoot: {[fabricId: string]: TopologyRoot} = {};
    private cachedLatestSnapshot: {[fabricId: string]: TopologySnapshot} = {};

    private cachedDefaultTopologyTimestamp: {[fabricId: string]: number} = {};
    private cachedDefaultTopologyRoot: {[fabricId: string]: TopologyRoot} = {};
    private cachedAllChangeOverviews: {[fabricId: string]: ChangeOverview[]} = {};

    public async setup() {
        this.client = await MongoClient.connect(this.config.host, {
            useNewUrlParser: true, // TODO: Can be removed when mongoDriver is finally updated
            useUnifiedTopology: true,
        });
        TopologyDatabase.log.info(`Setup '${this.config.host}${this.config.database}'`);
        this.db = this.client.db(this.config.database);
        this.topologySnapshotCollection = await this.db.createCollection<TopologySnapshot>('topologySnapshot');
        this.topologyDefaultTimestampCollection = await this.db.createCollection<SingletonTopologyDefaultTimestamp>(
            'topologyDefaultTimestamp',
            {
                capped: true,
                max: 1, // Allow just one document in the collection
                size: 1024 * 1024 * 2, // Size has to be specified. 2MiByte should be enough
            });
        await this.topologySnapshotCollection.createIndex({ fabricId : 1, timestamp: 1 });
        await this.updateCache();
    }

    public async insert(fabricId: FabricId,
                        timestamp: number,
                        topologyRoot: TopologyRoot,
                        visPositions: VisPreRenderedPositions,
                        changes: ChangeEntry[]) {
        const circularJsonRoot = CircularJson.stringify(topologyRoot);
        const doc = {
            timestamp,
            fabricId,
            visPositions,
            changes,
            topologyRoot: circularJsonRoot,
        };
        this.cachedLatestSnapshot[fabricId] = doc;
        await this.topologySnapshotCollection.insertOne(doc);
        await this.updateChangeOverviewCache(fabricId);
    }

    /**
     * Will return the topology root that can be used for example: to map metric data to ports.
     * Do not provide this data to the client!
     * Since its often so that the VisMap is not optimized and stored yet.
     * @param fabricId
     */
    public getInternalLatestTopologyRoot(fabricId: FabricId): TopologyRoot | undefined {
        return this.cachedLatestTopologyRoot[fabricId];
    }

    public getCurrentDefaultTopologyTimestamp(fabricId: FabricId): number | undefined {
        return this.cachedDefaultTopologyTimestamp[fabricId];
    }

    /**
     * This topology root can be provided to the user
     * @param fabricId
     */
    public getCurrentDefaultTopologyRoot(fabricId: FabricId): TopologyRoot | undefined {
        return this.cachedDefaultTopologyRoot[fabricId];
    }

    /**
     * Internal use only!
     * @param fabricId
     * @param root
     */
    public setInternalLatestTopologyRoot(fabricId: FabricId, root: TopologyRoot) {
        this.cachedLatestTopologyRoot[fabricId] = root;
    }

    public async getAllChangeOverviews(fabricId: FabricId): Promise<ChangeOverview[]> {
        return this.cachedAllChangeOverviews[fabricId];
    }

    public async createDiff(fabricId: FabricId, leftTimestamp: number, rightTimestamp: number): Promise<ChangeEntry[]> {
        const leftResult = await this.topologySnapshotCollection.findOne({ fabricId, timestamp: leftTimestamp }, {
            projection: { _id: 0, topologyRoot: 1 },
        });

        if (!leftResult) {
            throw new ApiError('Left timestamp cannot be found', 400);
        }

        const rightResult = await this.topologySnapshotCollection.findOne({ fabricId, timestamp: rightTimestamp }, {
            projection: { _id: 0, topologyRoot: 1 },
        });

        if (!rightResult) {
            throw new ApiError('Left timestamp cannot be found', 400);
        }

        const leftTopology = CircularJson.parse(leftResult.topologyRoot);
        const rightTopology = CircularJson.parse(rightResult.topologyRoot);

        return TopologyChangeDetector.detectChanges(rightTopology, leftTopology).changes;
    }

    public async getLatest(fabricId: FabricId): Promise<TopologySnapshot | undefined> {
        if (!this.cachedLatestSnapshot[fabricId]) {
            this.cachedLatestSnapshot[fabricId] = await this.topologySnapshotCollection
                .find({ fabricId })
                .sort({ timestamp: -1 })
                .limit(1).next();
        }
        if (this.cachedLatestSnapshot[fabricId] && !this.cachedLatestTopologyRoot[fabricId]) {
            this.setInternalLatestTopologyRoot(
                fabricId,
                CircularJson.parse(this.cachedLatestSnapshot[fabricId].topologyRoot),
            );
        }
        return this.cachedLatestSnapshot[fabricId];
    }

    public async setFabricDefaultByTimestamp(fabricId: string, newDefaultTimestamp: number) {
        const snapshot = await this.topologySnapshotCollection.findOne({ fabricId, timestamp: newDefaultTimestamp }, {
            projection: { _id: 0, topologyRoot: 1 },
        });
        if (!snapshot) {
            throw new ApiError('Cant find version by timestamp', 400);
        }

        await this.setCurrentDefaultTopologyRoot(fabricId, newDefaultTimestamp, CircularJson.parse(snapshot.topologyRoot));
    }

    public async setCurrentDefaultTopologyRoot(fabricId: FabricId, timestamp: number, topologyRoot: TopologyRoot) {
        this.cachedDefaultTopologyTimestamp[fabricId] = timestamp;
        this.cachedDefaultTopologyRoot[fabricId] = topologyRoot;

        TopologyDatabase.log.info(`[${fabricId}] Set default topology to timestamp '${timestamp}'`);

        await this.topologyDefaultTimestampCollection.updateOne({}, { $set: { [fabricId]: timestamp } }, { upsert: true });

        await this.updateChangeOverviewCache(fabricId);
        return topologyRoot;
    }

    /**
     * Calculates and saves the current
     * ChangeOverview inside the cachedAllChangeOverviews object
     * @param fabricId
     */
    private async updateChangeOverviewCache(fabricId: FabricId) {
        TopologyDatabase.log.info(`Update change overview for '${fabricId}'`);
        const currentRoot = this.getCurrentDefaultTopologyRoot(fabricId);
        const defaultTimestamp = this.getCurrentDefaultTopologyTimestamp(fabricId);

        const result = this.topologySnapshotCollection.find({fabricId, $or:
        [
                    { timestamp: { $gt: Date.now() - 14 * 24 * 60 * 60 * 1000/*globalMetricTimeRange (14 days)*/ } },
                    { timestamp: { $eq: defaultTimestamp } },
        ],
        },                                                  {
            projection: { _id: 0, timestamp: 1, topologyRoot: 1 },
        });

        const overviews: ChangeOverview[] = [];
        await result.forEach((snapshot) => {
            const parsedRoot: TopologyRoot = CircularJson.parse(snapshot.topologyRoot);
            const { changes } = TopologyChangeDetector.detectChanges(parsedRoot, currentRoot);
            overviews.push(ChangeOverviewCounter.generateOverview(snapshot.timestamp, changes));
        });

        this.cachedAllChangeOverviews[fabricId] = overviews;
    }

    private async updateDefaultTopologyCache() {
        TopologyDatabase.log.info(`Update default topologies cache`);
        const defaultTimestamps = await this.topologyDefaultTimestampCollection.findOne({}, {
            projection: { _id: 0 },
        });

        if (!defaultTimestamps) {
            TopologyDatabase.log.warn('No default timestamps are available! Starting the server for the first time?');
            return;
        }

        for (const fabricId of Object.keys(defaultTimestamps)) {
            this.cachedDefaultTopologyTimestamp[fabricId] = defaultTimestamps[fabricId];
            const root = await this.topologySnapshotCollection.findOne({ fabricId, timestamp: defaultTimestamps[fabricId] }, {
                projection: { _id: 0, topologyRoot: 1 },
            });
            this.cachedDefaultTopologyRoot[fabricId] = CircularJson.parse(root.topologyRoot);
        }
    }

    private async updateCache() {
        await this.updateDefaultTopologyCache();

        for (const fabric of this.fabricConfigs) {
            TopologyDatabase.log.info(`Fetch last snapshot for '${fabric.fabricId}'`);
            if (!await this.getLatest(fabric.fabricId)) {
                TopologyDatabase.log.warn(`'${fabric.fabricId}' has never provided a topology! Is the daemon running?`);
            } else {
                await this.updateChangeOverviewCache(fabric.fabricId);
            }
        }
    }
}
