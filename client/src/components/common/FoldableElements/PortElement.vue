<template>
    <div class="portElement">
        <span class="port-number" v-html="highlight(port.portNumber, highlightQuery)">
        </span>
        <span class="port-connection">
            <span v-if="port.connection">
                <span class="clickable"
                      @click="selectElement(port.connection)"
                      title="Click to select the connection">
                    <span class="port-speed"
                          v-html="highlight(portLinkString, highlightQuery)">
                    </span>
                    <span>to </span>
                </span>
                <ElementLink class="element-link" :element="port.toPort"></ElementLink>
            </span>
            <span v-else class="port-connection--not-connected">
                <span v-html="highlight('Not connected', highlightQuery)"></span>
            </span>
        </span>
    </div>
</template>

<script lang="ts">
    import { Component, Prop } from 'vue-property-decorator';
    import {TopologyCa} from '@/../../common/models/Client/TopologyTreeModels';
    import Collapsible from '../CollapsibleComponent.vue';
    import FoldableElementBase from './FoldableElementBase.vue';
    import ElementLink from '../ElementLink.vue';
    import {TopologyPort} from '../../../../../common/models/Client/TopologyTreeModels';
    import {LinkDetailsToString} from '../../../../../common/models/AliasTypes';

    @Component({
        components: {
            ElementLink,
            Collapsible,
        },
    })
    export default class PortElement extends FoldableElementBase {

        @Prop()
        public port!: TopologyPort;

        private get portLinkString(): string {
            if (!this.port.connection) {
                return '???';
            }
            return LinkDetailsToString(this.port.connection.link);
        }
    }
</script>

<style scoped>
    .port-number {
        display: inline-block;
        font-size: 15px;
        width: 35px;
    }

    .port-speed {
        display: inline-block;
        font-size: 15px;
        width: 60px;
    }

    .port-connection--not-connected {
        color: red;
    }

    .element-link {
        margin-left: 5px;
        display: inline-block;
    }
</style>
