export interface ILoginIdentityProvider {
    /**
     * Check if credentials are correct
     * @param {string} username
     * @param {string} password
     * @returns {Promise<boolean>} Resolves as true or false whenever the credentials are correct
     */
    checkCredentials(username: string, password: string): Promise<boolean>;
}
