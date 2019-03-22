import * as ldapjs from 'ldapjs';
import { LdapConfig } from '../ConfigService';
import { ILoginIdentityProvider } from './ILoginIdentityProvider';
import * as path from 'path';
import * as fs from 'fs';
import { LoginError } from '../../api/v2/controllers/LoginController';
import { Logger } from '../../lib/Logger';

export class LDAPLoginService implements ILoginIdentityProvider {
    private static readonly log = Logger.getLogger(LDAPLoginService);

    private readonly client: ldapjs.Client;

    private readonly config: LdapConfig;

    constructor(config: LdapConfig) {
        this.config = config;

        LDAPLoginService.log.info(`Using LDAP server: '${this.config.url}'`);

        this.client = ldapjs.createClient({
            url: this.config.url,
            tlsOptions: {
                rejectUnauthorized: false, // TODO
            },
        });
    }

    public checkCredentials(username: string, password: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // To prevent ldap injection
            const saveName = String(username).replace(/[^a-z0-9]/gi, '');
            const query = this.config.queryString.replace('$username', saveName);
            this.client.bind(query, password, async (err) => {
                if (!(await this.isUserAllowed(username))) {
                    reject(new LoginError('Not allowed to use this application', 403));
                }
                resolve(!err);
            });
        });
    }


    /**
     * Checks if a user is in the allowedUsers.json file
     * @param {string} username
     * @returns {Promise<boolean>} resolves with true if the user is allowed
     */
    private async isUserAllowed(username: string): Promise<boolean> {
        // No allowed users file was defined in the configuration. Allow all users.
        if (!this.config.allowedUsersFileName) {
            return true;
        }

        return await new Promise<boolean>(async (resolve, reject) => {
            const absPath = path.resolve(this.config.allowedUsersFileName);
            fs.readFile(absPath, 'utf8', (err, rawData) => {
                if (err) {
                    LDAPLoginService.log.error(`Failed to load file '${absPath}'`);
                    resolve(false);
                    return;
                }
                const allowedUsers = JSON.parse(rawData).allowedUsers;
                resolve(allowedUsers.includes(username));
            });
        });
    }
}
