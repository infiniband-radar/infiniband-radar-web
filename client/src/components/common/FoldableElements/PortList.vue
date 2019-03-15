<template>
    <div class="portList">
        <div v-for="ca in host.cas">
            <div class="ca-description" v-if="host.cas.length > 1 || config.alwaysDisplayCaDescriptionInPortList">
                <span v-html="highlight(`${ca.description}`, highlightQuery)" :title="ca.caGuid"></span>
                <span class="ca-guid">{{ca.caGuid}}</span>
            </div>
            <div v-for="port in ca.ports.filter(p=>p)">
                <PortElement :port="port" :highlightQuery="highlightQuery" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop } from 'vue-property-decorator';
    import {
        TopologyCa,
    } from '@/../../common/models/Client/TopologyTreeModels';
    import PortElement from './PortElement.vue';
    import FoldableElementBase from './FoldableElementBase.vue';
    import {TopologyHost} from '../../../../../common/models/Client/TopologyTreeModels';

    @Component({
        components: {
            PortElement,
        },
    })
    export default class PortList extends FoldableElementBase {

        @Prop()
        public host!: TopologyHost;
    }
</script>

<style scoped>
    .portList {
        padding: 5px;
    }
    .ca-description {
        border-bottom: 1px solid black;
        margin-bottom: 5px;
    }

    .ca-guid {
        margin-left: 5px;
        font-size: 10px;
    }

</style>
