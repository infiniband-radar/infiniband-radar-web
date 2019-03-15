import Vue from 'vue';
import Vuex from 'vuex';
import {ApiClient} from '@/libs/ApiClient';
import {TimeRange} from '@/libs/TimeRange';
import {RouterUtils} from '@/libs/RouterUtils';
import {FabricModel} from '../../../common/models/Client/FabricModel';
import {
    SelectableTopologyElement,
    TopologyCa,
    TopologyConnection,
    TopologyElement,
    TopologyHost,
    TopologyPort,
    TopologyRoot,
} from '../../../common/models/Client/TopologyTreeModels';
import {TopologyTreeUtils} from '../../../common/TopologyTreeUtils';
import {ClientConfig, defaultClientConfig} from '../../../common/models/Client/ClientConfig';
import {defaultHumanTimeRange} from '@/libs/ClientConstants';
import {HumanTimeRange} from '@/libs/HumanTimeRange';
import {VisPreRenderedColors, VisPreRenderedPositions} from '../../../common/models/Client/VisPreRenderdModels';
import {GetTopologyResponse} from '../../../common/models/Client/network/GetTopologyResponse';
import {
    FlotConnectionMetric,
    FlotDataConverter,
    FlotGlobalMetric,
    FlotHostMetric,
} from '@/libs/FlotDataConverter';
import {VisDataModel} from '../../../common/models/Client/VisDataModels';
import {ChangeOverview} from '../../../common/models/Client/ChangeOverviews';


Vue.use(Vuex);

export interface StoreDefinition {
    isApiReachable: boolean;

    config: ClientConfig;
    fabrics: FabricModel[];

    fabric?: FabricModel; // Is undefined when no fabric is selected
    topology?: TopologyRoot;
    topologyTimestamp: number;
    visPositions: VisPreRenderedPositions;
    visData: VisDataModel;
    visColors: VisPreRenderedColors;

    metricOfGlobalAggregatedUsage?: FlotGlobalMetric;
    metricDataOfSelectedHost?: FlotHostMetric;
    metricDataOfSelectedConnection?: FlotConnectionMetric;

    changes?: ChangeOverview[];
    defaultTopologyTimestamp?: number;
    rightVersionTimestamp: number;

    highlightedIndex?: number;

    selectedElement?: TopologyElement;

    fetchingDataCount: number;
    timeRange: TimeRange;
    humanTimeRange: HumanTimeRange;
    isAutoReloading: boolean;

    showChangeOverlay: boolean;
}

const store = new Vuex.Store<StoreDefinition>({
    state: {
        isApiReachable: true,

        config: Object.assign({}, defaultClientConfig),
        fabrics: [],

        fabric: undefined,
        topology: undefined,
        topologyTimestamp: 0,
        visPositions: {},
        visData: {
            nodes: [],
            edges: [],
        },
        visColors: {},

        metricOfGlobalAggregatedUsage: undefined,
        metricDataOfSelectedHost: undefined,
        metricDataOfSelectedConnection: undefined,

        changes: undefined,
        defaultTopologyTimestamp: undefined,
        rightVersionTimestamp: 0,

        highlightedIndex: undefined,

        selectedElement: undefined,

        fetchingDataCount: 0,
        timeRange: defaultHumanTimeRange.evaluate(),
        humanTimeRange: defaultHumanTimeRange,
        isAutoReloading: false,

        showChangeOverlay: false,
    },
    getters: {
        selectedHost(state): TopologyHost | undefined {
            return TopologyTreeUtils.tryGetHost(state.selectedElement);
        },
        selectedCa(state): TopologyCa | undefined {
            return TopologyTreeUtils.tryGetCa(state.selectedElement);
        },
        selectedPort(state): TopologyPort | undefined {
            return TopologyTreeUtils.tryGetPort(state.selectedElement);
        },
        selectedConnection(state): TopologyConnection | undefined {
            return TopologyTreeUtils.tryGetConnection(state.selectedElement);
        },
    },
    mutations: {
        setIsApiReachable(state, newState: boolean) {
            state.isApiReachable = newState;
        },
        setVisColors(state, visColors: VisPreRenderedColors) {
            state.visColors = visColors;
        },
        setTopologyChanges(state, changes?: ChangeOverview[]) {
            state.changes = changes;
        },
        setDefaultTopologyTimestamp(state, defaultTopologyTimestamp?: number) {
            state.defaultTopologyTimestamp = defaultTopologyTimestamp;
        },
        setTopologyResponse(state, response: GetTopologyResponse) {
            state.visPositions = response.visPositions;
            state.visData = response.visData;
            state.topology = response.topology as any as TopologyRoot;
            state.topologyTimestamp = response.timestamp;
        },
        setHighlightedIndex(state, highlightedIndex?: number) {
            if (state.config.highlightSeriesWhenHoverOverIt) {
                state.highlightedIndex = highlightedIndex;
            }
        },
        setMetricOfGlobalAggregatedUsage(state, metric?: FlotGlobalMetric) {
            state.metricOfGlobalAggregatedUsage = metric;
        },
        setMetricDataOfSelectedHost(state, metric?: FlotHostMetric) {
            state.metricDataOfSelectedHost = metric;
        },
        setMetricDataOfSelectedConnection(state, metric?: FlotConnectionMetric) {
            state.metricDataOfSelectedConnection = metric;
        },
        setFabricList(state, fabricList: FabricModel[]) {
            state.fabrics = fabricList;
        },
        setFabric(state, fabric: FabricModel) {
            state.fabric = fabric;
        },
        startFetchingData(state) {
            state.fetchingDataCount++;
        },
        endFetchingData(state) {
            state.fetchingDataCount--;
        },
        setSelectedElement(state, selectedElement?: TopologyElement) {
            state.selectedElement = selectedElement;
        },
        setTimeRange(state, timeRange: TimeRange) {
            const humanTimeRange = new HumanTimeRange(timeRange.from.unix(), timeRange.to.unix());
            state.humanTimeRange = humanTimeRange;
            state.timeRange = humanTimeRange.evaluate();
        },
        setHumanTimeRange(state, humanTimeRange: HumanTimeRange) {
            state.timeRange = humanTimeRange.evaluate();
            state.humanTimeRange = humanTimeRange;
        },
        setClientConfig(state, config: ClientConfig) {
            state.config = config;
        },
        resetClientConfig(state) {
            state.config = Object.assign({}, defaultClientConfig);
        },
        setRightVersionTimestamp(state, timestamp: number) {
            state.rightVersionTimestamp = timestamp;
        },
        setShowChangeOverlay(state, show: boolean) {
            state.showChangeOverlay = show;
        },
        setAutoReload(state, isAutoReloading: boolean) {
            state.isAutoReloading = isAutoReloading;
        },
    },
    actions: {
        async loadInitialFabricData(context) {
            context.commit('setMetricOfGlobalAggregatedUsage', undefined);
            context.commit('setDefaultTopologyTimestamp', undefined);
            context.commit('setTopologyChanges', undefined);
            context.commit('setAutoReload', false);

            await store.dispatch('loadTimeRange', false);
            store.dispatch('loadGlobalMetric');
            store.dispatch('loadChanges');
        },
        async selectElementByRouter(context, element?: SelectableTopologyElement): Promise<boolean> {
            const wasSameElement = context.state.selectedElement === element;

            if (!wasSameElement) {
                context.commit('setSelectedElement', element);
                context.commit('setMetricDataOfSelectedHost', undefined);
                context.commit('setMetricDataOfSelectedConnection', undefined);
                context.commit('setHighlightedIndex', undefined);
            }

            context.dispatch('loadMetricDataForSelectedElement');
            return true;
        },
        async selectElement(context, element?: SelectableTopologyElement): Promise<boolean> {
            if (context.state.fetchingDataCount) {
                return false;
            }
            const path = RouterUtils.getLocationForElement(element);
            await RouterUtils.pushAsync(path);
            return true;
        },
        async ensureLoadedClientConfig(context) {
            const config = Object.assign({}, await ApiClient.getClientConfig());
            context.commit('setClientConfig', config);
        },
        async ensureFabricList(context) {
            const data = await ApiClient.getAllFabrics();
            context.commit('setFabricList', data);
        },
        async triggerLoadTimeRange(context, timeRange: TimeRange) {
            context.commit('setTimeRange', timeRange);
            await context.dispatch('loadTimeRange');
        },
        async triggerLoadHumanTimeRange(context, humanTimeRange: HumanTimeRange) {
            context.commit('setHumanTimeRange', new HumanTimeRange(humanTimeRange.from, humanTimeRange.to));
            await context.dispatch('loadTimeRange');
        },
        async loadTimeRange(context, setUrl: boolean = true) {
            if (context.state.fetchingDataCount) {
                throw new Error('Already fetching data');
            }

            context.commit('startFetchingData');

            try {
                if (context.state.fabric == null) {
                    throw new Error('Current fabric is null');
                }

                if (setUrl) {
                    const path = RouterUtils.getLocationForTimeRange(context.state.timeRange);
                    await RouterUtils.pushAsync(path);
                }

                await context.dispatch('loadVisColor');
                await context.dispatch('loadMetricDataForSelectedElement');

            } finally {
                context.commit('endFetchingData');
            }
        },
        async loadTopology(context) {
            if (!context.state.fabric) {
                throw new Error('Current fabric is null');
            }

            const data = await ApiClient.getTopology(context.state.fabric.fabricId);
            context.commit('setTopologyResponse', data);
        },
        async loadGlobalMetric(context) {
            if (context.state.fabric == null) {
                throw new Error('Current fabric is null');
            }

            const data = await ApiClient.getGlobalMetric(context.state.fabric.fabricId);

            const metric = FlotDataConverter.convertGlobalMetric(data);

            context.commit('setMetricOfGlobalAggregatedUsage', metric);
        },
        async loadChanges(context) {
            if (context.state.fabric == null) {
                throw new Error('Current fabric is null');
            }
            const overviews = await ApiClient.getVersionOverviews(context.state.fabric.fabricId);

            context.commit('setDefaultTopologyTimestamp', overviews.defaultTimestamp);
            context.commit('setTopologyChanges', overviews.changes);
        },
        async loadVisColor(context) {
            const visColors = await ApiClient.getVisColors(
                context.state.fabric!.fabricId,
                context.state.timeRange.from.unix(),
                context.state.timeRange.to.unix(),
            );

            context.commit('setVisColors', visColors);
        },
        async loadMetricDataForSelectedElement(context) {
            if (!context.state.fabric) {
                throw new Error('Current fabric is null');
            }

            if (!context.state.selectedElement) {
                return;
            }

            context.commit('startFetchingData');

            try {
                const host = context.getters.selectedHost as TopologyHost;
                if (host) {
                    const data = await ApiClient.getHostMetric(
                        context.state.fabric.fabricId,
                        host.hostname,
                        context.state.timeRange.from.unix(),
                        context.state.timeRange.to.unix(),
                    );

                    const metric = FlotDataConverter.convertHostMetric(data);

                    context.commit('setMetricDataOfSelectedHost', metric);
                } else {
                    const connection = context.getters.selectedConnection as TopologyConnection;
                    if (connection) {
                        const data = await ApiClient.getConnectionMetric(
                            context.state.fabric.fabricId,
                            connection.connectionId,
                            context.state.timeRange.from.unix(),
                            context.state.timeRange.to.unix(),
                        );

                        const metric = FlotDataConverter.convertConnectionMetric(data);

                        context.commit('setMetricDataOfSelectedConnection', metric);
                    }
                }



            } finally {
                context.commit('endFetchingData');

            }
        },
        async compareAgainstDefault(context, timestamp: number) {
            const changes = context.state.changes;
            if (!changes) {
                return;
            }
            context.commit('setRightVersionTimestamp', timestamp);
            context.commit('setShowChangeOverlay', true);
        },
    },
});

export default store;

store.watch(() => store.state.config, (newConfig: ClientConfig) => {
    ApiClient.setClientConfig(newConfig);
}, {
    deep: true,
});
