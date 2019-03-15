import { ConfigService } from '../../../services/ConfigService';
import { Controller, Response, Get, Path, Route, Security, Put, Body, Query, BodyProp, Post } from 'tsoa';
import { Inject } from 'typescript-ioc';
import { Logger } from '../../../lib/Logger';
import { TopologyDatabase } from '../../../services/TopologyDatabase';
import { RawTopology } from '../../../../../common/models/DataCollector/RawTopology';
import { TopologyTreeBuilder } from '../../../lib/TopologyTreeBuilder';
import * as CircularJson from 'circular-json';
import { GetTopologyResponse } from '../../../../../common/models/Client/network/GetTopologyResponse';
import { VisNetworkConverter } from '../../../lib/VisNetworkConverter';
import { TopologyOptimizerService } from '../../../services/TopologyOptimizerService';
import { ApiValidationHelper } from '../ApiValidationHelper';
import { FabricId } from '../../../../../common/models/AliasTypes';
import { MetricDatabase } from '../../../services/MetricDatabase';
import { TopologyChangeDetector } from '../../../lib/TopologyChangeDetector';
import { VisPreRenderedPositions } from '../../../../../common/models/Client/VisPreRenderdModels';
import { GetVersionChangeOverviewsResponse } from '../../../../../common/models/Client/network/GetChangeOverviewsResponse';
import { ApiError } from '../../ApiError';
import { ChangeBaseEntry } from '../../../../../common/models/Client/ChangeEntry';

@Route('v2/topologies')
export class TopologiesController extends Controller {

    private static readonly log = Logger.getLogger(TopologiesController);

    @Inject
    private config: ConfigService;

    @Inject
    private optimizerServer: TopologyOptimizerService;

    @Inject
    private topologyDb: TopologyDatabase;

    @Inject
    private metricDb: MetricDatabase;

    @Response(400, 'Bad Request')
    @Security('user')
    @Get('{fabricId}')
    public async getFabricTopology(@Path('fabricId') fabricId: string): Promise<GetTopologyResponse> {
        ApiValidationHelper.ensureValidFabricId(fabricId);
        const snapshot = await this.topologyDb.getLatest(fabricId);
        const visData = VisNetworkConverter.convertTopology(CircularJson.parse(snapshot.topologyRoot));
        return {
            visPositions: snapshot.visPositions,
            timestamp: snapshot.timestamp,
            topology: snapshot.topologyRoot,
            visData,
        };
    }

    @Response(400, 'Bad Request')
    @Security('user')
    @Get('{fabricId}/versions')
    public async getFabricVersions(@Path('fabricId') fabricId: string): Promise<GetVersionChangeOverviewsResponse> {
        ApiValidationHelper.ensureValidFabricId(fabricId);

        const defaultTimestamp = this.topologyDb.getCurrentDefaultTopologyTimestamp(fabricId);

        if (!defaultTimestamp) {
            throw new ApiError('No default topology version available', 500);
        }

        return {
            defaultTimestamp,
            changes: await this.topologyDb.getAllChangeOverviews(fabricId),
        };
    }

    @Response(400, 'Bad Request')
    @Security('user')
    @Get('{fabricId}/diff')
    public async getFabricDiff(@Path('fabricId') fabricId: string,
                               @Query() leftTimestamp: number,
                               @Query() rightTimestamp: number): Promise<ChangeBaseEntry[]> {
        ApiValidationHelper.ensureValidFabricId(fabricId);

        return await this.topologyDb.createDiff(fabricId, leftTimestamp, rightTimestamp);
    }

    @Response(400, 'Bad Request')
    @Security('user')
    @Post('{fabricId}/setDefault')
    public async setFabricDefaultVersion(@Path('fabricId') fabricId: string,
                                         @BodyProp('newDefaultTimestamp') newDefaultTimestamp: number) {
        ApiValidationHelper.ensureValidFabricId(fabricId);
        await this.topologyDb.setFabricDefaultByTimestamp(fabricId, newDefaultTimestamp);
    }

    @Security('staticToken')
    @Response(400, 'Bad Request')
    @Put('{fabricId}')
    public async putFabricTopology(@Path('fabricId') fabricId: string, @Body() rawTopology: RawTopology): Promise<void> {
        ApiValidationHelper.ensureValidFabricId(fabricId);
        this.putAndTriggerOptimization(fabricId, rawTopology); // Ignore promise for fast API Response
    }

    private async putAndTriggerOptimization(fabricId: FabricId, rawTopology: RawTopology) {
        const timestamp = Date.now();
        const root = TopologyTreeBuilder.buildTopologyTree(rawTopology);
        const oldRoot = this.topologyDb.getInternalLatestTopologyRoot(fabricId);


        const { changes, rerenderRequired } = TopologyChangeDetector.detectChanges(root, oldRoot);
        if (oldRoot) {

            if (!changes.length) {
                return; // No need optimize and store an unchanged fabric
            }

            TopologiesController.log.info(`[${fabricId}] Detected ${changes.length} changes`);
        } else {
            TopologiesController.log.info(`[${fabricId}] Got first topology version`);
        }

        const visData = VisNetworkConverter.convertTopology(root);

        this.topologyDb.setInternalLatestTopologyRoot(fabricId, root);

        const lastTopology = await this.topologyDb.getLatest(fabricId);
        let visPositions: VisPreRenderedPositions = {};
        if (rerenderRequired) {
            const result = await this.optimizerServer.optimize(fabricId, visData);

            await this.metricDb.selfMonitoring.writeTopologyTime(
                fabricId,
                rawTopology.discoveryTimeMs,
                result.iterations,
                result.timeTookInMs,
            );

            visPositions = result.visPositions;
        } else {
            visPositions = lastTopology.visPositions;
        }

        if (!oldRoot) {
            await this.topologyDb.setCurrentDefaultTopologyRoot(fabricId, timestamp, root);
        }
        await this.topologyDb.insert(fabricId, timestamp, root, visPositions, changes);
    }
}
