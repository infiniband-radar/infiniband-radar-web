import * as CircularJson from 'circular-json';
import {FabricModel} from '../../../common/models/Client/FabricModel';
import {LoginResponse} from '../../../common/models/Client/network/LoginResponse';
import {LoginRequest} from '../../../common/models/Client/network/LoginRequest';
import {TopologyRoot} from '../../../common/models/Client/TopologyTreeModels';
import {GetTopologyResponse} from '../../../common/models/Client/network/GetTopologyResponse';
import {ConnectionId, FabricId} from '../../../common/models/AliasTypes';
import {
    ConnectionMetricData,
    GlobalMetricData,
    HostMetricData,
} from '../../../common/models/Client/MetricData';
import {VisPreRenderedColors} from '../../../common/models/Client/VisPreRenderdModels';
import {ClientConfig} from '../../../common/models/Client/ClientConfig';
import {GetVersionChangeOverviewsResponse} from '../../../common/models/Client/network/GetChangeOverviewsResponse';
import {ChangeEntry} from '../../../common/models/Client/ChangeEntry';
import deepEqual from 'deep-equal';
import {LoginConfig} from '../../../common/models/Client/LoginConfig';
import store from '../modules/store';

export interface ApiResponse {
    readonly status: number;
    readonly data: any;
}

export class ApiClient {
    private static cachedRequests: {[path: string]: Promise<any> | undefined} = {};

    private static readonly tokenName = 'token';

    /**
     * Checks if a token is stored and still valid
     * @returns {Promise<boolean>} resolves with true if valid
     */
    public static async hasValidToken(): Promise<boolean> {
        if (!(await this.getLoginConfig()).loginType) {
            return true;
        }

        if (!this.hasTokenInStore()) {
            return false;
        }
        try {
            await this.getAllFabrics();
            return true;
        } catch (e) {
            this.removeToken();
            return false;
        }
    }

    /**
     * Checks if a user needs to log in to use this side
     * @returns {Promise<boolean>}
     */
    public static async getLoginConfig(): Promise<LoginConfig> {
        try {
            return await this.internalCacheGetRequest('/v2/login/loginConfig');
        } catch (e) {
            store.commit('setIsApiReachable', false);
            throw e;
        }
    }

    /**
     * Logins the user and stores the token internally
     * @param {string} username
     * @param {string} password
     * @param {boolean} keepSession
     * @returns {Promise<void>}
     */
    public static async login(username: string, password: string, keepSession: boolean) {
        const response = await this.internalPostRequest('/v2/login', {
                username,
                password,
                keepSession,
            } as LoginRequest,
        );
        if (response.status === 200) {
            const data = response.data as LoginResponse;
            this.setToken(data.userToken, keepSession);
        }
    }

    /**
     * Provides a list of all fabrics
     * @note Requires a valid token
     * @returns {Promise<FabricModel[]>}
     */
    public static async getAllFabrics(): Promise<FabricModel[]> {
        return ApiClient.internalCacheGetRequest<FabricModel[]>('/v2/fabrics');
    }

    /**
     * Provides the TopologyRoot of a given fabric
     * @param {string} fabricId
     * @note Requires a valid token
     * @returns {Promise<TopologyRoot>}
     */
    public static async getTopology(fabricId: FabricId): Promise<GetTopologyResponse> {
        const response = (await this.internalGetRequest(
            `/v2/topologies/${fabricId}`,
        )).data as GetTopologyResponse;
        const topology = CircularJson.parse(response.topology);
        return {
            timestamp: response.timestamp,
            visPositions: response.visPositions,
            visData: response.visData,
            topology,
        };
    }

    public static async getVersionOverviews(fabricId: FabricId): Promise<GetVersionChangeOverviewsResponse> {
        return (await this.internalGetRequest(
            `/v2/topologies/${fabricId}/versions`,
        )).data;
    }


    public static async getGlobalMetric(fabricId: FabricId): Promise<GlobalMetricData> {
        return (await this.internalGetRequest(
            `/v2/metrics/${fabricId}/global`,
        )).data;
    }
    public static async getVisColors(fabricId: FabricId,
                                     fromTime: number,
                                     toTime: number): Promise<VisPreRenderedColors> {
        return (await this.internalGetRequest(
            `/v2/metrics/${fabricId}/visColors?fromTime=${fromTime}&toTime=${toTime}`,
        )).data;
    }

    public static async getHostMetric(fabricId: FabricId,
                                      hostname: string,
                                      fromTime: number,
                                      toTime: number): Promise<HostMetricData> {
        return (await this.internalGetRequest(
            `/v2/metrics/${fabricId}/${hostname}?fromTime=${fromTime}&toTime=${toTime}`,
        )).data;
    }

    public static async getConnectionMetric(fabricId: FabricId,
                                            connectionId: ConnectionId,
                                            fromTime: number,
                                            toTime: number): Promise<ConnectionMetricData> {
        return (await this.internalGetRequest(
            `/v2/metrics/${fabricId}/connection/${connectionId}?fromTime=${fromTime}&toTime=${toTime}`,
        )).data;
    }

    public static async getTopologyDiff(fabricId: FabricId,
                                        leftVersionTimestamp: number,
                                        rightVersionTimestamp: number): Promise<ChangeEntry[]> {
        return (await this.internalGetRequest(
            `/v2/topologies/${fabricId}/diff?leftTimestamp=${leftVersionTimestamp}&rightTimestamp=${rightVersionTimestamp}`,
        )).data;
    }

    public static async setDefaultTopology(fabricId: FabricId, newDefaultTimestamp: number) {
        return (await this.internalPostRequest(
            `/v2/topologies/${fabricId}/setDefault`,
            {newDefaultTimestamp}, false,
        )).data;
    }

    public static async getClientConfig(): Promise<Readonly<ClientConfig>> {
        return this.internalCacheGetRequest<ClientConfig>('/v2/config');
    }

    public static async setClientConfig(newConfig: ClientConfig) {
        if (!deepEqual(newConfig, await this.getClientConfig(), { strict: true })) {
            ApiClient.cachedRequests['/v2/config'] = Promise.resolve(Object.assign({}, newConfig));
            await this.internalPostRequest(
                '/v2/config',
                newConfig, false);
        }
    }

    /**
     * Removes the token from the internal storage.
     * Can be used to logout a user
     */
    public static removeToken() {
        localStorage.removeItem(ApiClient.tokenName);
        sessionStorage.removeItem(ApiClient.tokenName);
        ApiClient.cachedRequests = {};
    }

    private static setToken(token: string, storePersistent: boolean) {
        ApiClient.removeToken();
        if (storePersistent) {
            localStorage.setItem(ApiClient.tokenName, token);
        } else {
            sessionStorage.setItem(ApiClient.tokenName, token);
        }
    }

    private static getToken(): string | null {
        return localStorage.getItem(ApiClient.tokenName) || sessionStorage.getItem(ApiClient.tokenName);
    }

    private static internalCacheGetRequest<T>(path: string): Promise<T> {
        let cached = ApiClient.cachedRequests[path];
        if (!cached) {
            cached = ApiClient.cachedRequests[path] = this.internalGetRequest(path).then((res) => res.data);
        }

        return cached;
    }

    private static async internalFetch(path: string,
                                       method: string,
                                       body?: object,
                                       expectReturnData: boolean = true): Promise<ApiResponse> {
        const headers: {[key: string]: string} = {
            Accept: 'application/json, text/plain, */*',
        };

        const init: RequestInit = {
            method,
            headers,
        };

        if (await this.hasTokenInStore()) {
            headers.Authorization = `Bearer ${this.getToken()}`;
        }

        if (body) {
            headers['Content-Type'] = `application/json`;
            init.body = JSON.stringify(body);
        }

        const response = await fetch(`/api${path}`, init);
        if (response.status === 401) {
            this.removeToken();
        }


        let data;
        if (expectReturnData) {
            try {
                data = await response.json();
            } catch {
                    throw await response.json();
            }

            if (expectReturnData && response.status === 204) {
                throw new Error('Got no data but expected data');
            }

            if (response.status !== 200) {
                throw data;
            }
        }

        return {
            status: response.status,
            data,
        };
    }

    private static async internalGetRequest(path: string): Promise<ApiResponse> {
        return await this.internalFetch(path, 'get');
    }

    private static async internalPostRequest(path: string, data: object, expectReturnData: boolean = true): Promise<ApiResponse> {
        return this.internalFetch(path, 'post', data, expectReturnData);
    }

    private static hasTokenInStore(): boolean {
        return this.getToken() != null;
    }
}
