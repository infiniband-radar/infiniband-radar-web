import * as express from 'express';
import * as http from 'http';
import { RegisterRoutes } from '../../dist/routes';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import * as path from 'path';
import { ValidateError } from 'tsoa/dist/routeGeneration/templateHelpers';
import { ApiError } from './ApiError';
import { performance } from 'perf_hooks';
import * as onFinished from 'on-finished';
import { Container } from 'typescript-ioc';
import { MetricDatabase } from '../services/MetricDatabase';
import { IS_DEVELOPMENT_ENVIRONMENT } from '../lib/Environment';

// Needed so the crawler finds all references
import './v2/ApiV2Base';
import {Logger} from '../lib/Logger';

export class ApiServer {
    private static readonly log = Logger.getLogger(ApiServer);
    private readonly app: express.Express;
    private readonly server: http.Server;

    public constructor() {
        this.app = express();
        this.app.disable('x-powered-by');

        this.server = http.createServer(this.app);

        const metricDb = Container.get(MetricDatabase) as MetricDatabase;

        this.app.use((req, res, next) => {
            if (IS_DEVELOPMENT_ENVIRONMENT) {
                ApiServer.log.debug(`Requested path (${req.method}) '${req.path}'`);
            }
            const start = performance.now();
            onFinished(res, (err) => {
                const end = performance.now();
                const tookInMs = Math.round(end - start);
                ApiServer.log.debug(`Took ${tookInMs} ms to process (${req.method}) '${req.path}' StatusCode: ${res.statusCode}`);
                metricDb.selfMonitoring.writeApiResponseTime(
                    req.method,
                    req.path,
                    res.statusCode,
                    tookInMs,
                );
            });
            next();
        });


        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(methodOverride());
        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Origin', '*');
            next();
        });

        this.addStaticFiles();
        RegisterRoutes(this.app);

        this.app.use((req, res) => {
            throw new ApiError('404 not found', 404);
        });

        this.addExceptionHandler();
    }

    public listen(host: string, port: number) {
        this.server.listen(port, host);
    }

    private addExceptionHandler() {
        this.app.use((err, req, res, next) => {
            if (
                err instanceof ApiError ||
                err instanceof ValidateError
            ) {
                const errorJson: any = {
                    message: err.message,
                    name: err.name,
                    status: err.status,
                };
                if (err instanceof ValidateError) {
                    errorJson.fields = err.fields;
                }
                res.status(err.status);
                res.json(errorJson);
                return;
            }
            next(err);
        });
    }

    private addStaticFiles() {
        this.app.get('/', (req, res) => {
            res.redirect('/api');
        });
        this.app.get('/api', (req, res) => {
            res.send(`
                <h1>Welcome to the InfiniBand-Radar API</h1>
                <p>Click <a href="/api/documentation">here</a> to see the API documentation.</p>
                <p>This API is defined with Swagger. <b>Definitions: <a href="/api/swagger.json">here</a></b></p>
            `);
        });
        this.app.use('/api/documentation', (req, res) => {
            res.sendFile(path.resolve(__dirname, '../../dist/documentation.html'));
        });
        this.app.use('/api/swagger.json', (req, res) => {
            res.sendFile(path.resolve(__dirname, '../../dist/swagger.json'));
        });
    }

}
