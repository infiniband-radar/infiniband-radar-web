<template>
    <div class="connectionInfoPanel">
        <h1>Connection</h1>
        <p>Speed: {{portLinkString}}</p>
        <p>PossibleSpeed: {{possiblePortLinkString}}</p>
        Upload <ElementLink class="path" :element="portA"/>:
        <FlotPlot ref="portAPlot"/>
        Upload <ElementLink class="path" :element="portB"/>:
        <FlotPlot ref="portBPlot"/>
    </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import {
    TopologyConnection,
    TopologyPort,
} from '../../../../common/models/Client/TopologyTreeModels';
import ElementLink from '../common/ElementLink.vue';
import {LinkDetailsToString} from '../../../../common/models/AliasTypes';
import FlotPlot from '../common/FlotPlot.vue';
import {FlotConnectionMetric} from '../../libs/FlotDataConverter';
import {ClientConfig} from '../../../../common/models/Client/ClientConfig';
import {LinkSpeedConverter} from '../../../../common/LinkSpeedConverter';

@Component({
    components: {
        FlotPlot,
        ElementLink,
    },
})
export default class ConnectionInfoPanel extends Vue {

    private portAPlot!: FlotPlot;
    private portBPlot!: FlotPlot;

    protected async mounted() {
        this.portAPlot = this.$refs.portAPlot as FlotPlot;
        this.portBPlot = this.$refs.portBPlot as FlotPlot;

        this.onMetricDataChanged();
    }

    private get connection(): TopologyConnection {
        return this.$store.state.selectedElement as TopologyConnection;
    }

    private get portA(): TopologyPort {
        return this.connection.portA;
    }

    private get portB(): TopologyPort {
        return this.connection.portB;
    }

    private get portLinkString(): string {
        return LinkDetailsToString(this.connection.link);
    }

    private get possiblePortLinkString(): string {
        return LinkDetailsToString(this.connection.possibleLink);
    }

    private get metricData(): FlotConnectionMetric | undefined {
        return this.$store.state.metricDataOfSelectedConnection;
    }

    @Watch('metricData')
    private onMetricDataChanged() {
        if (!this.metricData) {
            this.portAPlot.setData(undefined);
            this.portBPlot.setData(undefined);
            return;
        }

        const elementMap =  [this.connection];

        this.portAPlot.setData(this.metricData.portA, elementMap);
        this.portBPlot.setData(this.metricData.portB, elementMap);
    }
}
</script>

<style scoped>
    .path {
        display: inline-block;
    }

</style>
