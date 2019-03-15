<template>
    <div class="foldableHostElementStaticInfo">
        <div class="host-info--flags" v-once>
            <div v-if="host.subnetManager"
                 class="host-info--flag--sm"
                 :title="`SubnetManager: ${host.subnetManager.state}(${host.subnetManager.priority})`">{{host.subnetManager.state[0]}}</div>
            <div v-if="unconnectedPortCount"
                 class="host-info--flag--has-unconnected-ports"
                 :title="`Has ${unconnectedPortCount} unconnected ports`">{{unconnectedPortCount}}</div>
            <div v-if="linkIsNotOptimal"
                 class="host-info--flag--link-is-not-optimal"
                 ></div>
        </div>
        <div>
            <span class="clickable host-info--hostname"
                  @click="selectElement(host)"
                  v-html="highlight(host.hostname, highlightQuery)">
            </span>
            <span v-if="config.showHostCaGuidsInSearchList"
                  class="host-info--ca-guids"
                  v-for="ca in host.cas"
                  v-html="highlight(`${ca.caGuid} (${ca.description})`, highlightQuery)">
            </span>
        </div>
        <!--<NetworkDiagram :mini="true" class="host-info--diagram"/>-->
    </div>
</template>

<script lang="ts">
    import {Component, Prop} from 'vue-property-decorator';
    import {TopologyHost} from '../../../../../common/models/Client/TopologyTreeModels';
    import FoldableElementBase from './FoldableElementBase.vue';

    @Component({
        components: {
        },
    })
    export default class FoldableHostElementStaticInfo extends FoldableElementBase {

        @Prop()
        public host!: TopologyHost;

        private get unconnectedPortCount(): number {
            let count = 0;

            for (const ca of this.host.cas) {
                for (const port of ca.ports) {
                    if (port && !port.connection) {
                        count++;
                    }
                }
            }

            return count;
        }

        private get linkIsNotOptimal(): boolean {
            // TODO check if link != possibleLink
            return false;
        }
    }
</script>

<style scoped>

    .foldableHostElementStaticInfo {
        display: inline-flex;
    }

    .host-info > * {
        display: inline-block;
        align-self: center;
    }

    .foldableHostElementStaticInfo:not(:first-child) {
        border-top: 1px solid black;
    }

    .host-info--hostname {
        display: block;
        font-size: 25px;
        height: 30px;
    }

    .host-info--ca-guids {
        font-family: monospace;
        display: block;
        font-size: 13px;
    }

    .host-info--diagram {
        height: 30px;
        width: 100px;
    }

    .host-info--flags {
        display: block;
        width: 10px;
    }

    .host-info--flags > * {
        text-align: center;
        font-size: 10px;
        line-height: 10px;
        vertical-align: middle;
        font-weight: bold;
    }

    .host-info--flag--sm {
        background-color: #00e5ff;
    }

    .host-info--flag--has-unconnected-ports {
        background-color: #f69dbe;
    }

</style>
<style>
    .foldableHostElement .portList {
        border-top: 1px dashed black;
        border-left: 1px dashed black;
        margin-top: 7px;
        margin-left: 20px;
    }
</style>
