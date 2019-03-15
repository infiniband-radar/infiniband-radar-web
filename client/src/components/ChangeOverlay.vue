<template>
    <div class="changeOverlay center-content">
        <div class="innerOverlay card box-shadow">
            <div class="top-section">
                <div class="menu">
                    <div>
                        <label for="left">
                            Left
                        </label>

                        <select :disabled="updateInProgress" v-model="leftVersionTimestamp" id="left">
                            <option v-for="overview in changeOverviews" :value="overview.timestamp" :class="getCssClassForTimeSelection(overview)">{{ toHumanTimestamp(overview.timestamp) }}</option>
                        </select>

                        <label for="right">
                            Right
                        </label>

                        <select :disabled="updateInProgress" v-model="rightVersionTimestamp" id="right">
                            <option v-for="overview in changeOverviews" :value="overview.timestamp" :class="getCssClassForTimeSelection(overview)">{{ toHumanTimestamp(overview.timestamp) }}</option>
                        </select>

                    </div>
                    <div>
                        <button :disabled="updateInProgress" class="button button--red" @click="setRightVersionAsDefault()">Set <i>right</i> version as new <i>default</i></button>
                    </div>
                    <div>
                        <button :disabled="updateInProgress" class="button button--gray" @click="close">X</button>
                    </div>
                </div>

                <div v-if="$store.state.config.showChangeOverlayTutorial">
                    <CollapsibleComponent>
                        <h3 slot="info">Help</h3>
                        <div>
                            <h4>Color coding</h4>
                            <table>
                                <tr><td>Added</td><td class="added">Green</td></tr>
                                <tr><td>Modified</td><td class="modified">Orange </td></tr>
                                <tr><td>Removed</td><td class="removed">Red </td></tr>
                            </table>
                            <ul>
                                <li><p>You will compare <i>left</i> to <i>right</i>. So if something is <span class="removed">red</span>, it means that the item was removed in the <i>right</i> version</p></li>
                                <li><p>Click "Set <i>right</i> version as new <i>default</i>" to set a new topology version as default (golden template)</p></li>
                            </ul>
                        </div>
                    </CollapsibleComponent>
                </div>
            </div>
            <div class="result">
                <CollapsibleComponent class="result--hosts" :doNotCollapseInitially="true">
                    <div slot="info"><h1>Hosts <NumberOfChangeTypes v-if="hostOverviewDetails" :overviewDetails="hostOverviewDetails"/></h1></div>
                    <div>
                        <table class="clear-table" v-if="hostChanges.length">
                            <thead>
                            <tr>
                                <th>Hostname</th>
                                <th>SM Status</th>
                            </tr>
                            </thead>
                            <tbody>
                                <tr v-for="change in hostChanges" :class="`change-status--${getChangeStatus(change)}`">
                                    <td><span>{{change.hostname}}</span></td>
                                    <td>{{change.smState}}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p v-else>Both versions are the same</p>
                    </div>
                </CollapsibleComponent>
                <CollapsibleComponent class="result--connections" :doNotCollapseInitially="true">
                    <div slot="info"><h1>Connections <NumberOfChangeTypes  v-if="connectionOverviewDetails" :overviewDetails="connectionOverviewDetails"/></h1></div>
                    <div>
                        <table class="clear-table" v-if="connectionChanges.length">
                            <thead>
                            <tr>
                                <th>Port A</th>
                                <th>Port B</th>
                                <th>Link</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="change in connectionChanges" :class="`change-status--${getChangeStatus(change)}`">
                                <td><span>{{change.portAHostname}}/{{change.portACaDesc}}/{{change.portAPort}}</span></td>
                                <td><span>{{change.portBHostname}}/{{change.portBCaDesc}}/{{change.portBPort}}</span></td>
                                <td><span>{{linkDetailsToString(change.link)}}</span><span v-if="change.newLink">=><span>{{linkDetailsToString(change.newLink)}}</span></span></td>
                            </tr>
                            </tbody>
                        </table>
                        <p v-else>Both versions are the same</p>
                    </div>
                </CollapsibleComponent>

            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import CollapsibleComponent from './common/CollapsibleComponent.vue';
    import NumberOfChangeTypes from './common/NumberOfChangeTypes.vue';
    import {ApiClient} from '../libs/ApiClient';
    import {ChangeOverview, ChangeOverviewDetails} from '../../../common/models/Client/ChangeOverviews';
    import Moment from 'moment';
    import {
        ChangeEntry,
        ChangeTypeCategory,
        ChangeTypeStatus,
        changeTypeToStatus,
    } from '../../../common/models/Client/ChangeEntry';
    import {ChangeOverviewCounter} from '../../../common/ChangeOverviewCounter';
    import {LinkDetails, LinkDetailsToString} from '../../../common/models/AliasTypes';

    @Component({
        components: {
            NumberOfChangeTypes,
            CollapsibleComponent,
        },
    })
    export default class ChangeOverlay extends Vue {

        private updateInProgress = false;
        private leftVersionTimestamp: number = 0;
        private rightVersionTimestamp: number = 0;
        private hostOverviewDetails?: ChangeOverviewDetails = null as any;
        private connectionOverviewDetails?: ChangeOverviewDetails = null as any;
        private hostChanges: ChangeEntry[] = [];
        private connectionChanges: ChangeEntry[] = [];

        private get changeOverviews(): ChangeOverview[] | undefined {
            return this.$store.state.changes;
        }

        protected beforeMount() {
            this.leftVersionTimestamp = this.$store.state.defaultTopologyTimestamp!;
            this.rightVersionTimestamp = this.$store.state.rightVersionTimestamp!;
        }

        @Watch('leftVersionTimestamp')
        @Watch('rightVersionTimestamp')
        private async loadDiff() {
            if (!this.$store.state.fabric || !this.leftVersionTimestamp || !this.rightVersionTimestamp) {
                return [];
            }

            this.updateInProgress = true;
            try {
                const allChanges = await ApiClient.getTopologyDiff(
                    this.$store.state.fabric.fabricId,
                    this.leftVersionTimestamp,
                    this.rightVersionTimestamp,
                );
                const details = ChangeOverviewCounter.generateOverviewDetails(allChanges);

                this.hostOverviewDetails = details.host;
                this.connectionOverviewDetails = details.connection;

                this.hostChanges = allChanges.filter((c) =>
                    changeTypeToStatus[c.changeType].category === ChangeTypeCategory.Host,
                );

                this.connectionChanges = allChanges.filter((c) =>
                    changeTypeToStatus[c.changeType].category === ChangeTypeCategory.Connection,
                );

            } finally {
                this.updateInProgress = false;
            }
        }

        private async setRightVersionAsDefault() {
            if (!this.$store.state.fabric) {
                return;
            }
            const response = confirm(
                `Do you want ${this.toHumanTimestamp(this.rightVersionTimestamp)} as new default topology version?`,
            );
            if (response) {
                try {
                    this.updateInProgress = true;
                    await ApiClient.setDefaultTopology(this.$store.state.fabric.fabricId, this.rightVersionTimestamp);
                    await this.$store.dispatch('loadChanges');
                } finally {
                    this.updateInProgress = false;
                }
            }
        }

        private getChangeStatus(change: ChangeEntry): ChangeTypeStatus {
            return changeTypeToStatus[change.changeType].status;
        }

        private toHumanTimestamp(timestamp: number): string {
            return Moment(timestamp).format('DD.MM.YYYY HH:mm');
        }

        private close() {
            this.$store.commit('setShowChangeOverlay', false);
        }

        private linkDetailsToString(link: LinkDetails) {
            return LinkDetailsToString(link);
        }

        private getCssClassForTimeSelection(changeOverview: ChangeOverview): string {
            if (changeOverview.timestamp === this.$store.state.defaultTopologyTimestamp) {
                return 'select-option--default';
            }
            if (this.containsNoOverviewChanges(changeOverview)) {
                return 'select-option--like-default';
            }
            return '';
        }

        private containsNoOverviewChanges(overview: ChangeOverview): boolean {
            return !ChangeOverviewCounter.containsOverviewChanges(overview);
        }
    }
</script>

<style scoped>
    .changeOverlay {
        position: fixed;
        height: 100%;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.3);
    }

    .innerOverlay {
        display: flex;
        flex-direction: column;
        height: 80%;
        width: 80%;
        padding: 5px;
    }

    .menu {
        display: flex;
        justify-content: space-between;
    }

    .menu > div {
        display: inline-block;
    }

    .top-section {
        border-bottom: 1px solid black;
    }

    .result {
        flex-grow: 1;
        overflow-y: scroll;
        height: 100%;
    }

    .result > *:not(:last-child) {
        border-bottom: 1px dashed gray;
    }

    .select-option--default {
        background-color: #5397e1;
    }

    .select-option--like-default {
        background-color: #94c2e3;
    }

    .change-status--added {
        background-color: #b3db97;
    }

    .change-status--modified {
        background-color: #ffc107;
    }

    .change-status--removed {
        background-color: #e38484;
    }

    .clear-table tr {
        font-size: 21px;
    }

    .clear-table tr:not(:last-child) {
        border-bottom: 1px solid black;
    }
</style>
