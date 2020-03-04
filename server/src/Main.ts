import { Logger } from './lib/Logger';
import { Container } from 'typescript-ioc';
import { ConfigService } from './services/ConfigService';

const config = Container.get(ConfigService) as ConfigService;
Logger.setGlobalLogLevelFromString(config.getLogLevelAsString());

// Start server

import { Server } from './Server';
const server = new Server();
