import * as Threads from 'threads';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { AutoWired, Inject, Singleton } from 'typescript-ioc';
import { VisPreRenderedPositions } from '../../../common/models/Client/VisPreRenderdModels';
import { Logger } from '../lib/Logger';
import { VisDataModel } from '../../../common/models/Client/VisDataModels';

export interface TopologyOptimizerThreadResponse {
    visPositions: VisPreRenderedPositions;
    iterations: number;
    timeTookInMs: number;
}

@Singleton
@AutoWired
export class TopologyOptimizerService {
    @Inject
    private static log = Logger.getLogger(TopologyOptimizerService);

    private jobs: {
        [fabricId: string]: {
            thread: any,
            startTime: number,
        };
    } = {};

    public async optimize(fabricId: string, visData: VisDataModel): Promise<TopologyOptimizerThreadResponse> {
        TopologyOptimizerService.log.info(`[${fabricId}] Start optimization`);
        return await this.processTopology(fabricId, visData);
    }

    private async processTopology(fabricId: string, visData: VisDataModel): Promise<TopologyOptimizerThreadResponse> {
        // Kill existing jobs
        if (this.jobs[fabricId]) {
            TopologyOptimizerService.log.warn(
                `Killed existing optimization process for '${fabricId}' (Was running for ${this.jobs[fabricId].startTime}ms)`,
            );
            this.jobs[fabricId].thread.kill();
            this.jobs[fabricId] = null;
        }

        const start = performance.now();
        const thread = TopologyOptimizerService.createOptimizationThread(visData);
        this.jobs[fabricId] = {
            thread,
            startTime: start,
        };
        const response = (await thread.promise()) as TopologyOptimizerThreadResponse;
        this.jobs[fabricId] = null;
        thread.kill();
        response.timeTookInMs = Math.ceil(performance.now() - start);
        TopologyOptimizerService.log.info(`[${fabricId}] Optimization took ${response.timeTookInMs}ms`);
        return response;
    }

    private static createOptimizationThread(visData: VisDataModel): any {
        const thread = Threads.spawn(path.join(__dirname, './TopologyOptimizerThread.js'))
            .on('error', (error) => {
                thread.kill();
                console.error('Thread error', error);
            })
            .send(visData);
        return thread;
    }
}
