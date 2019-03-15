import * as express from 'express';
import { Container } from 'typescript-ioc';
import { AuthenticationService } from '../services/AuthenticationService';
import { ApiError } from './ApiError';

export class AuthenticationError extends ApiError {

}

const authenticationService = Container.get(AuthenticationService) as AuthenticationService;

function parseToken(req: express.Request, tokenIdentifier: string): string | null {
    const rawAuthorizationData: string = req.headers.authorization as string;
    if (!rawAuthorizationData) {
        return null;
    }
    const [identifier, token] = rawAuthorizationData.split(' ', 2);
    if (identifier !== tokenIdentifier) {
        return null;
    }
    return token;
}

export async function expressAuthentication(req: express.Request,
                                            securityName: string,
                                            scopes?: string[]): Promise<string | undefined> {
    switch (securityName) {
    case 'user':
        if (!authenticationService.isUserLoginRequired()) {
            return undefined;
        }
        const username = await authenticationService.isValidUserToken(parseToken(req, 'Bearer'));
        if (!username) {
            throw new AuthenticationError('Unauthorized', 401);
        }
        return username;
    case 'staticToken':
        if (!(await authenticationService.isValidServerToken(parseToken(req, 'StaticToken')))) {
            throw new AuthenticationError('Unauthorized', 401);
        }
        return undefined;
    default:
        throw new AuthenticationError('Unknown security name', 500);
    }
}
