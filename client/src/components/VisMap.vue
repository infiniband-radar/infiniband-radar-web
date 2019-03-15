<template>
    <div class="visMap">
        <div id="map" ref="map"></div>
        <GlobalMetric class="global-metric"/>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import * as Vis from 'vis';
import VisNetworkOptions from '../../../common/VisNetworkOptions.json';
import {
    TopologyConnection,
    TopologyHost,
    TopologyRoot,
} from '../../../common/models/Client/TopologyTreeModels';
import GlobalMetric from './VisMap/GlobalMetric.vue';
import {ClientConfig} from '../../../common/models/Client/ClientConfig';
import {VisPreRenderedColors, VisPreRenderedPositions} from '../../../common/models/Client/VisPreRenderdModels';
import {VisDataModel} from '../../../common/models/Client/VisDataModels';
import {RandomColorUtils} from '../libs/RandomColorUtils';

@Component({
    components: {
        GlobalMetric,
    },
})
export default class VisMap extends Vue {

    private network!: Vis.Network;

    protected created() {
        // Add event listener to focus the selected element when fired
        this.$bus.$on(this.$bus.eventNameFocusSelectedElement, this.onFocusSelectedElement);

        // Add event listener to have the camera show the entire network
        this.$bus.$on(this.$bus.eventNameShowEntireNetwork, this.onShowEntireNetwork);
    }

    protected mounted() {
        const networkContainer = this.$refs.map as HTMLElement;
        const clientOptions: Vis.Options = VisNetworkOptions;
        clientOptions.layout.improvedLayout = false;
        clientOptions.physics.enabled = false;
        clientOptions.physics.stabilization.enabled = false;

        this.network = new Vis.Network(networkContainer, {}, clientOptions);

        console.time('[VisMap] Load pre-rendered view');
        this.onTopologyChanged();
        this.onVisColorsChanged();
        console.timeEnd('[VisMap] Load pre-rendered view');

        this.onSelectedConnectionChanged();
        this.onShowEntireNetwork();
        this.onFocusSelectedElement();
        this.onEnableMapPhysicsSimulationChanged();

        this.network.setOptions({
            physics: {
                enabled: true,
                minVelocity: 1.5,
            },
        });
        this.network.on('click', this.onClickOnNetwork.bind(this));
    }

    protected beforeDestroy() {
        // Remove all event handlers
        this.$bus.$off(this.$bus.eventNameFocusSelectedElement);
        this.$bus.$off(this.$bus.eventNameShowEntireNetwork);

        // Disable and destroy the network
        this.network.destroy();
    }

    private get topology(): TopologyRoot {
        return this.$store.state.topology!;
    }

    private get visPositions(): VisPreRenderedPositions {
        return this.$store.state.visPositions;
    }

    private get visData(): VisDataModel {
        return this.$store.state.visData;
    }

    private get visColors(): VisPreRenderedColors {
        return this.$store.state.visColors;
    }

    private get isFetchingData(): boolean {
        return this.$store.state.fetchingDataCount !== 0;
    }

    private get selectedHost(): TopologyHost | undefined {
        return this.$store.getters.selectedHost;
    }

    private get selectedConnection(): TopologyConnection | undefined {
        return this.$store.getters.selectedConnection;
    }

    private get config(): ClientConfig {
        return this.$store.state.config;
    }

    /**
     * Dispatches an event to select a given node or edge
     */
    private onClickOnNetwork(props: Vis.Properties) {
        if (props.nodes.length === 1) {
            const selectedHost = this.topology.hostMap[props.nodes[0]];
            this.$store.dispatch('selectElement', selectedHost);
            return;
        }
        if (props.edges.length === 1) {
            const selectedEdge = this.topology.connectionMap[props.edges[0]];
            this.$store.dispatch('selectElement', selectedEdge);
        } else {
            this.$store.dispatch('selectElement', null);
        }
    }

    /**
     * Sets the camera position to the currently selected node/edge
     */
    private onFocusSelectedElement() {
        const host = this.selectedHost;
        const connection = this.selectedConnection;

        let focusElementName: string | null = null;
        if (host) {
            focusElementName = host.hostname;
        } else if (connection) {
            focusElementName = `edgeId:${connection.connectionId}`;
        }

        if (!focusElementName) {
            return;
        }

        this.network.focus(focusElementName, {
            scale: 0.8,
        });
    }

    /**
     * Sets the camera position to see the entire fabric
     */
    private onShowEntireNetwork() {
        this.network.fit();
    }


    @Watch('isFetchingData')
    private onIsFetchingDataChanged(isFetchingData: boolean) {
        this.network.setOptions({
            interaction: {
                selectable: !isFetchingData,
            },
        });
    }

    @Watch('config.enableMapPhysicsSimulation')
    private onEnableMapPhysicsSimulationChanged() {
        this.network.setOptions({
            nodes: {
                physics: this.config.enableMapPhysicsSimulation,
            },
        });
    }

    @Watch('selectedHost')
    private onSelectedHostChanged() {
        if (this.selectedHost == null && this.selectedConnection == null) {
            this.network.setSelection({ nodes: [], edges: [] });
        } else if (this.selectedHost != null) {
            this.network.setSelection({ nodes: [this.selectedHost.hostname], edges: [] });
        }
    }

    @Watch('selectedConnection')
    private onSelectedConnectionChanged() {
        if (this.selectedHost == null && this.selectedConnection == null) {
            this.network.setSelection({ nodes: [], edges: [] });
        } else if (this.selectedConnection != null) {
            this.network.setSelection({ nodes: [], edges: [this.selectedConnection.connectionId] });
        }
    }


    @Watch('topology')
    private onTopologyChanged() {
        this.loadTopology();
        this.loadNodePositions();
    }

    @Watch('config.showConnectionColorsAsLinkType')
    @Watch('visColors')
    private onVisColorsChanged() {
        const newOptions: {[edgeId: string]: Vis.EdgeOptions} = {};

        if (this.config.showConnectionColorsAsLinkType) {
            if (!this.topology) {
                return;
            }
            for (const connection of this.topology.connections) {
                const color = RandomColorUtils.getLinkTypeColor(connection.link);
                newOptions[connection.connectionId] = {
                    color: {
                        fromNode: color,
                        toNode: color,
                    } as any,
                };
            }
        } else {
            const data = this.visColors;
            for (const connectionId of Object.keys(data)) {
                newOptions[connectionId] = {
                    color: {
                        fromNode: data[connectionId].portA,
                        toNode: data[connectionId].portB,
                    } as any,
                };
            }
        }

        this.bulkUpdateEdges(newOptions);
    }

    private loadTopology() {
        this.network.setData(this.visData);
    }

    private loadNodePositions() {
        const nodes = (this.network as any).body.nodes;
        const data = this.$store.state.visPositions!;
        for (const nodeId in nodes) {
            if (!nodes.hasOwnProperty(nodeId)) {
                continue;
            }
            const node = nodes[nodeId];
            if (!data[nodeId]) {
                console.error(`The pre saved position of node '${nodeId}' was not found`);
                continue;
            }
            node.x = data[nodeId].x;
            node.y = data[nodeId].y;
        }
    }

    private bulkUpdateEdges(newEdgeOptions: {[edgeId: string]: Vis.EdgeOptions}) {
        // Doing not intended stuff here, so '(.. as any)' must be used
        for (const edgeId of Object.keys(newEdgeOptions)) {
            const edge = (this.network as any).body.edges[edgeId];
            if (!edge) {
                console.error(`Tried to update unknown edge '${edgeId}'`);
                continue;
            }
            edge.setOptions(newEdgeOptions[edgeId]);
        }
        (this.network as any).body.emitter.emit('_dataChanged');
    }
}
</script>

<style scoped>
    #map {
        height: 100%;
        background-color: #ffffff;
    }

    .global-metric {
        position: relative;

        left: 10%;
        right: 30%;
        bottom: 120px;

        width: 80%;

        background-color: rgba(239, 239, 239, 0.5);
    }
</style>

<style>
    #map > div {
        outline: none;
    }
</style>
