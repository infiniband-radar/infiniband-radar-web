<template>
    <div class="hostInfoPanel">
        <div>
            <h1 class="info--hostname">{{ host.hostname }}</h1>
            <div class="info--subnet-manager" v-if="host.subnetManager">
                <h4>Subnet Manager</h4>
                <table>
                    <tbody>
                        <tr>
                            <td>State</td>
                            <td>{{host.subnetManager.state}}</td>
                        </tr>
                        <tr>
                            <td>Priority</td>
                            <td>{{host.subnetManager.priority}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <HostNetworkDiagram :host="host"></HostNetworkDiagram>
        </div>
        <h4>
            Ports
        </h4>
        <div class="port-list">
            <PortList :host="host" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import {TopologyHost} from '../../../../common/models/Client/TopologyTreeModels';
import PortList from '../common/FoldableElements/PortList.vue';
import HostNetworkDiagram from './HostNetworkDiagram.vue';

@Component({
    components: {
        HostNetworkDiagram,
        PortList,
    },
})
export default class HostInfoPanel extends Vue {

    private get host(): TopologyHost {
        return this.$store.getters.selectedHost!;
    }
}
</script>

<style scoped>

    .hostInfoPanel {
        display: flex;
        flex-flow: column;
        height: 100%;
    }

    .hostInfoPanel h4 {
        margin: 0;
        margin-top: 10px;
    }

    .info--hostname,
    .info--subnet-manager {
        display: inline-flex;
    }

    .info--subnet-manager {
        float: right;
    }

    table td:nth-child(2) {
        font-family: monospace;
    }

    .port-list {
        flex: 1 1 auto;
        border-top: 1px dashed black;
        border-left: 1px dashed black;
        margin-top: 7px;
        margin-left: 20px;
        overflow-y: scroll;
    }
</style>
