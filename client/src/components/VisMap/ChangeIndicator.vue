<template>
    <div class="changeIndicator">
        <div class="marker" :style="{'background-color': color}">
            <div class="marker-contains-default" v-if="containsDefault"></div>
            <div class="marker-contains-like-default" v-if="containsLikeDefault && !containsDefault"></div>
        </div>
        <div class="changeGroupDetailsOuter">
            <div class="changeGroupDetails card box-shadow">
                <table class="change-list">
                    <tbody>
                    <tr class="clickable" v-for="change in group.changes" :key="change.timestamp" @click="selectChange(change.timestamp)">
                        <td :title="toHumanDetailedTimestamp(change.timestamp)"><span class="change-timestamp">{{toHumanTimestamp(change.timestamp)}}</span></td>
                        <td>
                            <span class="change-currently-shown" v-if="change.timestamp === $store.state.topologyTimestamp">Currently shown</span>
                            <div v-if="containsNoOverviewChanges(change)">
                                <div v-if="change.timestamp === defaultTopologyTimestamp" class="is-default-timestamp">
                                    <p>Default</p>
                                </div>
                                <div v-else class="is-default-timestamp">
                                    <p><i>Like</i> default</p>
                                </div>
                            </div>
                            <div v-else>
                                <table>
                                    <tbody>
                                    <tr>
                                        <td><span>Host:</span></td>
                                        <td><NumberOfChangeTypes :overviewDetails="change.host"/></td>
                                    </tr>
                                    <tr>
                                        <td><span>Connections:</span></td>
                                        <td><NumberOfChangeTypes :overviewDetails="change.connection"/></td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <div class="border-top">{{group.changes.length}} grouped</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import Moment from 'moment';
    import NumberOfChangeTypes from '../common/NumberOfChangeTypes.vue';
    import {ChangeOverviewCounter} from '../../../../common/ChangeOverviewCounter';
    import {ChangeOverview} from '../../../../common/models/Client/ChangeOverviews';
    import {GroupedChanges} from '../../libs/GroupedChanges';

    @Component({
        components: {
            NumberOfChangeTypes,
        },
    })
    export default class ChangeIndicator extends Vue {

        @Prop()
        public group!: GroupedChanges;

        private get defaultTopologyTimestamp(): number | undefined {
            return this.$store.state.defaultTopologyTimestamp;
        }

        private get color(): string {
            if (this.containsLikeDefault && this.group.changes.length === 1) {
                return 'transparent';
            }
            return `rgba(255, 0, 0, ${0.15 * this.group.changes.length})`;
        }

        private get containsDefault(): boolean {
            return !!this.group.changes.find((overview) => overview.timestamp === this.defaultTopologyTimestamp);
        }

        private get containsLikeDefault(): boolean {
            return !!this.group.changes.find((overview) => this.containsNoOverviewChanges(overview));
        }

        private containsNoOverviewChanges(overview: ChangeOverview): boolean {
            return !ChangeOverviewCounter.containsOverviewChanges(overview);
        }

        private toHumanTimestamp(timestamp: number): string {
            return Moment(timestamp).format('DD.MM. HH:mm');
        }

        private toHumanDetailedTimestamp(timestamp: number): string {
            return Moment(timestamp).format('DD.MM.YYYY HH:mm:ss');
        }

        private async selectChange(changeTimestamp?: number) {
            await this.$store.dispatch('compareAgainstDefault', changeTimestamp);
        }
    }
</script>

<style scoped>
    .changeIndicator {
        display: flex;
        position: absolute;
        height: 100%;

        /* Hidden padding for easier hover*/
        --hidden-hover-padding: 4px;
        padding: 0 var(--hidden-hover-padding);
        transform: translate(calc(var(--hidden-hover-padding) * -1), 0);
    }

    .marker {
        display: flex;
        flex-direction: column-reverse;
        height: 100%;
        width: 3px;
    }

    .marker .marker-contains-default {
        height: 55%;
        width: 100%;
        background-color: #5397e1 !important;
    }

    .marker .marker-contains-like-default {
        height: 25%;
        width: 100%;
        background-color: #0fff00 !important;
    }

    .changeGroupDetailsOuter {
        z-index: 2;
        display: none;
        height: 0;
        width: 0;
    }

    .changeGroupDetails {
        transform: translate(-50%, -100%);
        position: absolute;
        padding: 5px;
    }

    .changeIndicator:hover .changeGroupDetailsOuter {
        display: block;

    }

    .change-list {
        border-spacing: 0;
        border-collapse: collapse;
    }

    .change-list > * {
        white-space:nowrap;
    }

    .change-list > tbody > tr:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .is-default-timestamp {
        font-weight: bold;
        text-align: center;
    }

    .change-timestamp {
        padding-right: 5px;
    }

    .change-currently-shown {
        font-weight: bold;
    }

</style>
