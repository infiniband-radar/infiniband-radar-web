import { Collection, Db, MongoClient } from 'mongodb';
import { AutoWired, Inject, Singleton } from 'typescript-ioc';
import { Logger } from '../lib/Logger';
import { ConfigService } from './ConfigService';
import { ClientConfig, defaultClientConfig } from '../../../common/models/Client/ClientConfig';
import { MongoClientConfig } from '../models/mongoDb/MongoClientConfig';

@Singleton
@AutoWired
export class UserDatabase {
    private static readonly log = Logger.getLogger(UserDatabase);

    @Inject
    private configService: ConfigService;

    private config = this.configService.getMongoDbConfig();
    private clientConfigCollection: Collection<MongoClientConfig>;

    private client: MongoClient;
    private db: Db;

    public async setup() {
        this.client = await MongoClient.connect(this.config.host, {
            useNewUrlParser: true, // TODO: Can be removed when mongoDriver is finally updated
            useUnifiedTopology: true,
        });
        UserDatabase.log.info(`Setup '${this.config.host}${this.config.database}'`);
        this.db = this.client.db(this.config.database);
        this.clientConfigCollection = await this.db.createCollection<MongoClientConfig>('clientConfig');
    }

    public async getClientConfig(username: string): Promise<ClientConfig> {
        const inDbStoredData = await this.clientConfigCollection.findOne({ username });
        if (!inDbStoredData) {
            return defaultClientConfig;
        }
        return inDbStoredData.config;
    }

    public async setClientConfig(username: string, config: ClientConfig): Promise<void> {
        await this.clientConfigCollection.updateOne(
            { username },
            { $set: { config } },
            { upsert: true },
            );
    }
}
