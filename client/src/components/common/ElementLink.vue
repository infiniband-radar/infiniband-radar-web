<template>
    <div class="elementLink">
        <div v-if="host" :class="`host-type--${hostType}`">
            <div class="path-segments button-group" v-on:click="selectElement(host)">
                <button class="hostname button" v-if="host">{{host.hostname}}</button>
                <button class="ca button" v-if="displayCa">{{ca.description}}</button>
                <button class="port button" v-if="port">{{port.portNumber}}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import {
    TopologyCa,
    TopologyElement,
    TopologyHost,
    TopologyPort,
} from '../../../../common/models/Client/TopologyTreeModels';
import {TopologyTreeUtils} from '../../../../common/TopologyTreeUtils';
import {HostType} from '../../../../common/models/AliasTypes';
import {ClientConfig} from '../../../../common/models/Client/ClientConfig';

@Component({
    components: {
    },
})
export default class ElementLink extends Vue {

    @Prop()
    public element!: TopologyElement;

    // Returns the name of the enum field
    private get hostType(): string {
        if (!this.host) {
            return HostType[HostType.Unknown];
        }
        return HostType[this.host.type];
    }

    private get displayCa(): boolean {
        return !!this.ca && (this.config.alwaysDisplayHostCaDescOnButtons || this.host!.cas.length > 1);
    }

    private get host(): TopologyHost | undefined {
        return TopologyTreeUtils.tryGetHost(this.element);
    }

    private get ca(): TopologyCa | undefined {
        return TopologyTreeUtils.tryGetCa(this.element);
    }

    private get port(): TopologyPort | undefined {
        return TopologyTreeUtils.tryGetPort(this.element);
    }

    private selectElement(element?: TopologyElement) {
        this.$bus.selectAndFocusElement(element);
    }

    private get config(): ClientConfig {
        return this.$store.state.config;
    }
}
</script>

<style scoped>
    .button-group {
    }

    .path-segments > .button {
        display: inline-block;
        padding: 1px 3px;
        margin-bottom: 3px;
        border-left-width: 3px;
        border-right-width: 3px;
        --border-radius: 3px;
        background-color: #c2b9bb;
        color: #0f0f0f;
    }

    .path-segments:hover > .button {
        background-color: #979092;
    }

    .host-type--Switch > .path-segments > .button {
        background-color: #00b9bb;
    }

    .host-type--Switch > .path-segments:hover > .button {
        background-color: #06797a;
    }

    .path-segments > .hostname {
        width: 150px;
    }
    .path-segments > .ca {
        width: 80px;
    }
    .path-segments > .port {
        width: 30px;
    }

    .path-segments > .button:not(:first-child) {
        border-left: 1px solid black !important;
    }

    /*
    .hostname {
        font-weight: bold;
        text-align: right;
        width: 150px;
    }

    .host-type--Switch > .hostname {
        color: #7fa1e1;
    }
    .host-type--Switch .ca-description {
        display: none;
    }
    */

</style>
