<template>
    <div class="searchPanel">
        <div id="innerContainerOffset">
            <div id="searchOptions">
                <input
                        id="searchInput"
                        type="search"
                        placeholder="Hostname, GUID, SM State"
                        spellcheck="false"
                        autocomplete="new-password"
                        v-model="searchInput"
                />
                <button class="button button--gray" v-on:click="foldAll">Fold all</button>
                <span :title="`Total CAs: ${totalCaCount}\nTotal Connections: ${totalConnectionCount}\nTotal Ports: ${totalPortCount}`">
                    Hosts: {{this.searchResult.length}}
                </span>
            </div>
            <div id="searchResult" ref="searchResult">
                <FoldableHostElement
                        v-for="host in this.searchResult"
                        :key="host.hostname"
                        :host="host"
                        :highlightQuery="searchInput"
                        ref="foldableHostElements"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FoldableHostElement from '../common/FoldableElements/FoldableHostElement.vue';
import {TopologyHost} from '../../../../common/models/Client/TopologyTreeModels';
import {LinkDetailsToString} from '../../../../common/models/AliasTypes';

@Component({
    components: {
        FoldableHostElement,
    },
})
export default class SearchPanel extends Vue {
    private searchInput: string = '';

    /**
     * Folds all CollapsibleElements recursively
     */
    private foldAll() {
        for (const element of this.$refs.foldableHostElements) {
            (element as FoldableHostElement).collapse();
        }
    }

    private get totalCaCount(): number {
        if (!this.$store.state.topology) {
            return 0;
        }
        return Object.keys(this.$store.state.topology.caMap).length;
    }

    private get totalConnectionCount(): number {
        if (!this.$store.state.topology) {
            return 0;
        }
        return Object.keys(this.$store.state.topology.connectionMap).length;
    }

    private get totalPortCount(): number {
        if (!this.$store.state.topology) {
            return 0;
        }

        let sum = 0;

        // @ts-ignore
        for (const ca of Object.values(this.$store.state.topology.caMap)) {
            // @ts-ignore
            sum += ca.ports.filter((p) => p).length;
        }

        return sum;
    }

    /**
     * Getter:
     * Search through all hosts/cas/ports and compares their properties with the search input
     * If a match was found the hosts will be added to the result
     */
    private get searchResult(): TopologyHost[] {
        if (!this.$store.state.topology) {
            return [];
        }

        const allHosts = this.$store.state.topology.hosts;

        const i = this.searchInput.trim().toLowerCase();
        if (i.length === 0) {
            return allHosts;
        }

        return allHosts.filter((n: TopologyHost) => {
            return n.hostname.toLowerCase().includes(i)
                || (n.subnetManager != null ?
                    ('sm'.includes(i) || n.subnetManager.state.toLowerCase().includes(i)) : false)
                || n.cas.some((ca) =>
                    ca.caGuid.toLowerCase().includes(i) ||
                    ca.description.toLowerCase().includes(i) ||
                    ca.ports.some((p) =>
                        p != null && (
                            p.portNumber.toString().includes(i) ||
                            (p.connection ?
                                LinkDetailsToString(p.connection.link)
                                : 'not connected').toLowerCase().includes(i)
                        ),
                    ),
                );
        });
    }

}
</script>

<style scoped>
    .searchPanel {
        height: 100%;
    }

    #innerContainerOffset {
        height: 100%;
        display: flex;
        flex-flow: column;
    }

    #searchOptions {
        /*
        margin-bottom: 20px;
        */
        flex: 0 1 auto;
    }

    #searchInput {
        /*
        padding: 8px;
        */
        width: 100%;
        font-size: 19px;
        border: none;
        text-decoration: dotted;
        border-bottom: 2px solid var(--border-gray);
        border-top: 2px solid var(--border-gray);
    }

    #searchResult {
        overflow-y: scroll;
        flex: 1 1 auto;
        border-top: 1px solid black;
    }
</style>
