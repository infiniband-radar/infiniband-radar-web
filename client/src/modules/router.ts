import Vue from 'vue';
import Router, {Route} from 'vue-router';
import Login from '../pages/Login.vue';
import FabricSelection from '../pages/FabricSelection.vue';
import FabricView from '../pages/FabricView.vue';
import HostInfoPanel from '../components/InfoPanel/HostInfoPanel.vue';
import SearchInfoPanel from '../components/InfoPanel/SearchPanel.vue';
import ConnectionInfoPanel from '../components/InfoPanel/ConnectionInfoPanel.vue';
import store from './store';
import {ApiClient} from '@/libs/ApiClient';
import {TopologyElement, TopologyRoot} from '../../../common/models/Client/TopologyTreeModels';
import {TopologyTreeUtils} from '../../../common/TopologyTreeUtils';
import {TimeRange} from '@/libs/TimeRange';
import {FabricModel} from '../../../common/models/Client/FabricModel';
import {defaultHumanTimeRange} from '@/libs/ClientConstants';

Vue.use(Router);

const applicationName = 'InfiniBand Radar';
let routerFabricFetchCount = 0;

export const router = new Router({
    mode: 'history',
    routes: [
        {
            name: 'FabricSelection',
            path: '/fabric',
            component: FabricSelection,
        },
        {
            path: '/fabric/:fabricId',
            component: FabricView,
            children: [
                {
                    name: 'FabricView_ConnectionInfoPanel',
                    path: 'connection/:connectionId',
                    component: ConnectionInfoPanel,
                },
                {
                    name: 'FabricView_HostInfoPanel',
                    path: ':hostname',
                    component: HostInfoPanel,
                },
                {
                    path: '',
                    name: 'FabricView_SearchInfoPanel',
                    component: SearchInfoPanel,
                    meta: {
                        keepAlive: true,
                        hideTopBar: true,
                        hideScrollBar: true,
                    },
                },
            ],
        },
        {
            path: '/login',
            component: Login,
        },
        {
            path: '*',
            redirect: '/fabric',
        },
    ],
});

async function setupNewFabric(foundFabric: FabricModel, route: Route) {
    console.time('[Router] setupNewFabric');
    store.commit('setFabric', foundFabric);
    await store.dispatch('loadTopology');

    if (route.query.from && route.query.to) {
        const timeRange = TimeRange.tryParse(route.query.from as string, route.query.to as string);
        store.commit('setTimeRange', timeRange);
    } else {
        store.commit('setHumanTimeRange', defaultHumanTimeRange);
    }

    await store.dispatch('loadInitialFabricData');
    console.timeEnd('[Router] setupNewFabric');

    routerFabricFetchCount = 0;
}

router.beforeEach(async (to, from, next) => {
    document.title = applicationName;
    const validToken = await ApiClient.hasValidToken();

    // Go to /fabric if user has valid token
    if (validToken && to.path === '/login') {
        next('/fabric');
        return;
    }

    // Go to /login if user has NO valid token
    if (!validToken && to.path !== '/login') {
        next('/login');
        return;
    }

    if (to.name === 'FabricSelection') {
        store.commit('setFabric', undefined);
    }

    // Only need to load a fabric if users enters a new fabric
    if (to.name && to.name.startsWith('FabricView_')) {
        if (from.params.fabricId !== to.params.fabricId) {
            if (routerFabricFetchCount) {
                console.warn('A fabric was already selected and is currently loading');
                next();
                return;
            }
            if (routerFabricFetchCount++) {
                if (routerFabricFetchCount > 50) {
                    throw new Error('STOP routing. Too many fetches'); // probably a bug...
                }
            }
            const fabricId = to.params.fabricId;
            await store.dispatch('ensureLoadedClientConfig');
            await store.dispatch('ensureFabricList');
            const foundFabric = (store.state.fabrics).find((f) => f.fabricId === fabricId);

            if (!foundFabric) {
                console.error(`Unknown fabricId: '${fabricId}'`);
                next('/fabric');
                return;
            }

            await setupNewFabric(foundFabric, to);
        }

        const fabric = store.state.fabric;
        if (fabric) {
            const element = parseSelectedElement(to, store.state.topology);
            const host = TopologyTreeUtils.tryGetHost(element);
            if (host) {
                document.title = `${host.hostname} | ${fabric.name} | ${applicationName}`;
            } else {
                document.title = `${fabric.name} | ${applicationName}`;
            }
        }
    }

    next();
});

// Add route hooks so the time and selected element will always be up to date when the path changes
router.afterEach(async (to, from) => {
    if (to.name && to.name.startsWith('FabricView_')) {
        await updateTimeRangeAndSelectedElement(from, to);
    }
});

/**
 * Finds the selected element and then commit it to the $store
 * @param to
 */
async function updateSelectedElement(to: Route) {
    const element = parseSelectedElement(to, store.state.topology);
    await store.dispatch('selectElementByRouter', element);
}

/**
 * Commits a new timeRange to the $store if a timeRange is set and differs from the routes
 * @param {Route} from
 * @param {Route} to
 */
async function updateTimeRangeAndSelectedElement(from: Route, to: Route) {
    const fromTimestamp = to.query.from;
    const toTimestamp = to.query.to;

    if (!(!fromTimestamp || !toTimestamp || fromTimestamp === toTimestamp)) {
        const timeRange = TimeRange.tryParse(fromTimestamp as string, toTimestamp as string);

        // Check if the timerange has changed
        if (timeRange.from.unix() !== store.state.timeRange.from.unix()
            || timeRange.to.unix() !== store.state.timeRange.to.unix()) {
            store.commit('setTimeRange', timeRange);
            await store.dispatch('loadVisColor');
        }
    }

    await updateSelectedElement(to);
}

/**
 * Tries to find the a TopologyElement according to the route parameters
 * @param {Route} route - The route with parameters that could lead to an Element
 * @param {TopologyRoot | undefined} topology - The TopologyRoot
 * @returns {TopologyElement | null}  The found element or undefined if nothing was found
 */
function parseSelectedElement(route: Route, topology?: TopologyRoot): TopologyElement | undefined {
    if (!topology) {
        return undefined;
    }

    const {
        connectionId,
        hostname,
        caDesc,
        portNum,
    } = route.params;

    const connection = topology.connectionMap[connectionId];
    if (connection) {
        return connection;
    }

    const host = topology.hostMap[hostname];
    if (!host) {
        return undefined;
    }

    const ca = host.cas.find((innerCa) => innerCa.description === caDesc);
    if (!ca) {
        return host;
    }

    const port = ca.ports[Number(portNum)];
    if (!port) {
        return ca;
    }

    return port;
}
