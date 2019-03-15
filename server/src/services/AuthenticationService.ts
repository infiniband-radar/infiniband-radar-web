import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import { LDAPLoginService } from './authentication/LDAPLoginService';
import * as jwt from 'jsonwebtoken';
import { ConfigService, LdapConfig } from './ConfigService';
import { ILoginIdentityProvider } from './authentication/ILoginIdentityProvider';
import * as assert from 'assert';
import { Logger } from '../lib/Logger';

interface UserTokenModel {
    username: string;
}

@Singleton
@AutoWired
export class AuthenticationService {
    private static readonly log = Logger.getLogger(AuthenticationService);

    @Inject
    private configService: ConfigService;

    private readonly config = this.configService.getAuthenticationConfig();

    private readonly identityProvider: ILoginIdentityProvider;


    constructor() {
        if (this.config.user) {
            const providerName = String(this.config.user.identityProvider.type).toLowerCase();
            AuthenticationService.log.info(`Using '${providerName}' as login service`);
            switch (providerName) {
            case 'ldap':
                this.identityProvider = new LDAPLoginService(this.config.user.identityProvider as LdapConfig);
                break;
            default:
                throw new Error(`Unknown identity provider '${providerName}'`);
            }
        }
    }

    /**
     * Checks if a given token is a valid server token
     * @param {string} token
     * @returns {Promise<boolean>}
     */
    public async isValidServerToken(token: string): Promise<boolean> {
        return !!(this.config.server[token]);
    }

    /**
     * @returns true if a user login is required to use the api
     */
    public isUserLoginRequired(): boolean {
        return !!this.identityProvider;
    }

    /**
     * Creates a new user token and checks the credentials
     * @param {string} username
     * @param {string} password
     * @returns {Promise<string | null>} Resolves with a token when the login credentials are correct, otherwise null
     */
    public async createUserToken(username: string, password: string): Promise<string | null> {
        this.ensureUserLoginRequired();
        if (await this.identityProvider.checkCredentials(username, password)) {
            return await this.createUserTokenInternal(username);
        }
        return null; // Login credentials are invalid
    }

    /**
     * Checks if a given user token is valid user token
     * @param {string} token
     * @returns {Promise<string | undefined>} Resolves with the username if the token is valid
     */
    public async isValidUserToken(token: string): Promise<string | undefined> {
        this.ensureUserLoginRequired();
        return ((await this.decodeJwtOrNull(token)) || {}).username;
    }

    /**
     * Ensures that a user login token is required, otherwise throws an error
     */
    private ensureUserLoginRequired() {
        assert(this.isUserLoginRequired());
    }

    private signJwtData(data: any): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(data, this.config.user.userTokenSharedKey, {
                expiresIn: this.config.user.userTokenExpirationTime,
            },
                     (err, encoded) => {
                         if (err) {
                             reject(err);
                             return;
                         }
                         resolve(encoded);
                     });
        });
    }

    private decodeJwtOrNull(token: string): Promise<any> {
        return new Promise((resolve) => {
            jwt.verify(
                token,
                this.config.user.userTokenSharedKey,
                (err, decoded) => {
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(decoded);
                });
        });
    }

    private async createUserTokenInternal(username: string): Promise<string> {
        const token: UserTokenModel = {
            username,
        };
        return await this.signJwtData(token);
    }
}
