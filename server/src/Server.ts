import { ApiServer } from './api/ApiServer';
import { Container, Inject } from 'typescript-ioc';
import { ConfigService } from './services/ConfigService';
import { Logger } from './lib/Logger';
import { MetricDatabase } from './services/MetricDatabase';
import { TopologyDatabase } from './services/TopologyDatabase';
import { UserDatabase } from './services/UserDatabase';
import { AuthenticationService } from './services/AuthenticationService';


export class Server {
    private static readonly log = Logger.getLogger(Server);

    @Inject
    private configService: ConfigService;

    private config = this.configService.getServerConfig();

    constructor() {
        this.start().catch((e) => {
            console.error(e);
            process.exit(1);
        });
    }

    private async start() {
        // Initialize databases
        await (Container.get(MetricDatabase) as MetricDatabase).setup();
        await (Container.get(TopologyDatabase) as TopologyDatabase).setup();
        await (Container.get(UserDatabase) as UserDatabase).setup();
        Server.log.info('Database setup complete');

        // Setup login service
        await (Container.get(AuthenticationService) as AuthenticationService);

        Server.log.info('Server startup complete');

        const apiServer = new ApiServer();
        apiServer.listen(
            this.config.host,
            this.config.port,
        );
        Server.log.info(
            `API Server is listening on http://${this.config.host}:${this.config.port}/`,
        );
    }
}
