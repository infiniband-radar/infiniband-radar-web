<template>
    <div class="hostNetworkDiagram">
        <div>
            <h4>Upload</h4>
            <FlotPlot ref="uploadPlot" />
            <h4>Download</h4>
            <FlotPlot ref="downloadPlot" />
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';

import {TopologyHost} from '../../../../common/models/Client/TopologyTreeModels';
import {ClientConfig} from '../../../../common/models/Client/ClientConfig';
import {FlotHostMetric} from '../../libs/FlotDataConverter';
import FlotPlot from '../common/FlotPlot.vue';

@Component({
    components: {
        FlotPlot,
    },
})
export default class HostNetworkDiagram extends Vue {
    @Prop()
    public host!: TopologyHost;

    private uploadPlot!: FlotPlot;
    private downloadPlot!: FlotPlot;

    protected async mounted() {
        this.uploadPlot = this.$refs.uploadPlot as FlotPlot;
        this.downloadPlot = this.$refs.downloadPlot as FlotPlot;

        this.onMetricDataChanged();
    }

    private get metricData(): FlotHostMetric | undefined {
        return this.$store.state.metricDataOfSelectedHost;
    }

    private get config(): ClientConfig {
        return this.$store.state.config;
    }

    @Watch('metricData')
    private onMetricDataChanged() {
        if (!this.metricData) {
            this.uploadPlot.setData(undefined);
            this.downloadPlot.setData(undefined);
            return;
        }

        const map = this.metricData.seriesToCaPort.map((info) => {
            if (!info) {
                return undefined;
            }

            const ca = this.host.cas.find((tmpCa) => tmpCa.description === info.caDescription);
            if (!ca) {
                return undefined;
            }

            return ca.ports[info.portNumber];
        });

        this.uploadPlot.setData(this.metricData.xmit, map, this.host.cas.length > 1);
        this.downloadPlot.setData(this.metricData.rcv, map, this.host.cas.length > 1);
    }

}
</script>

<style scoped>
</style>
