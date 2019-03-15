import { Body, Controller, Get, Post, Request, Response, Route } from 'tsoa';
import { Inject } from 'typescript-ioc';
import { AuthenticationService } from '../../../services/AuthenticationService';
import { ApiError } from '../../ApiError';
import * as express from 'express';
import { LoginConfig } from '../../../../../common/models/Client/LoginConfig';
import { LoginResponse } from '../../../../../common/models/Client/network/LoginResponse';
import { LoginRequest } from '../../../../../common/models/Client/network/LoginRequest';
import { Logger } from '../../../lib/Logger';

export class LoginError extends ApiError {
}

@Route('v2/login')
export class LoginController extends Controller {
    private static readonly log = Logger.getLogger(LoginController);

    @Inject
    private authenticationService: AuthenticationService;

    @Get('loginConfig')
    public async getLoginConfig(): Promise<LoginConfig> {
        return {
            // TODO: Extend to oAuth
            loginType: this.authenticationService.isUserLoginRequired() ? 'nameAndPassword' : undefined,
        };
    }

    @Post()
    @Response('400', 'Bad Request')
    @Response<LoginError>('403', 'Not allowed to use this application')
    @Response<LoginError>('400', 'Invalid login credentials')
    public async login(@Request() req: express.Request, @Body() request: LoginRequest): Promise<LoginResponse> {
        const username = request.username.toLocaleLowerCase();
        const token = await this.authenticationService.createUserToken(username, request.password);
        if (!token) {
            // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            throw new LoginError('Invalid login credentials', 400);
        }
        return {
            userToken: token,
        };
    }
}
