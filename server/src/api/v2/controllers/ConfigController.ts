import { Body, Controller, Get, Post, Request, Route, Security } from 'tsoa';
import { ConfigService } from '../../../services/ConfigService';
import { Inject } from 'typescript-ioc';
import { ClientConfig, defaultClientConfig } from '../../../../../common/models/Client/ClientConfig';
import * as express from 'express';
import { UserDatabase } from '../../../services/UserDatabase';
import * as assert from 'assert';
import {AuthenticationService} from '../../../services/AuthenticationService';

@Route('v2/config')
export class ConfigController extends Controller {

    @Inject
    private config: ConfigService;

    @Inject
    private userDb: UserDatabase;

    @Inject
    private authentication: AuthenticationService;

    @Security('user')
    @Get()
    public async getConfig(@Request() req: express.Request): Promise<ClientConfig> {
        if (!this.authentication.isUserLoginRequired()) {
            return defaultClientConfig;
        }

        assert(req['user']);
        return this.userDb.getClientConfig(req['user']);
    }

    @Security('user')
    @Post()
    public async setConfig(@Request() req: express.Request, @Body() newConfig: ClientConfig): Promise<void> {
        if (!this.authentication.isUserLoginRequired()) {
            return;
        }

        assert(req['user']);
        await this.userDb.setClientConfig(req['user'], newConfig);
    }
}
