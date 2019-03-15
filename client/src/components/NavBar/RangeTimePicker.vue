<template>
    <div class="rangeTimePicker">
        <MenuComponent ref="menu">
            <div slot="static" class="button-group" ref="timePickerButton"
                :class="{'autoreload-glow': isAutoReloading}">
                <button class="button button--gray"
                        :class="{'button--fake-disabled': (isFetchingData && !isAutoReloading)}"
                        @click="toggleMenu"
                >
                    <span>{{humanTimeRange.toHumanDescription()}}</span>
                </button>
                <button class="button button--gray reload-button"
                        :disabled="isFetchingData || isAutoReloading"
                >
                    <span class="data-freshness-indicator"
                          v-bind:style="{'animation-duration': freshnessDuration, 'animation-delay': freshnessStartOffset}"
                          v-bind:class="isFetchingData ? '' : 'data-freshness-indicator--animation'"
                    ></span>
                    <span class="icon icon--refresh spin"
                          v-bind:class="isFetchingData ? '' : 'spin--pause'"
                          @click="reloadHumanTimeRange()"
                    ></span>
                </button>
            </div>
            <div id="timePicker" class="card box-shadow">
                <div class="rangeTimePickerInner">
                    <section id="custom-range-section">
                        <h1>Custom range</h1>
                        <div>
                            <div>
                                <label for="time-from">
                                    From:
                                </label>
                                <input id="time-from" v-model="humanFromTime" type="text"/>
                            </div>
                            <div>
                                <label for="time-to">
                                    To:
                                </label>
                                <input id="time-to" v-model="humanToTime" type="text"/>
                            </div>
                            <button class="button button--blue" :disabled="isFetchingData" @click="onApply()">Apply</button>
                            <button class="button button--dark" :disabled="isFetchingData" @click="onToAbs()" title="Writes the last used timestamp in the input fields">To absolute time</button>
                        </div>
                        <hr>
                        <div class="autoreload-settings">
                            <label for="autoreload">Enable AutoReload
                                <input id="autoreload"
                                       type="checkbox"
                                       :class="{'autoreload-glow': isAutoReloading}"
                                       v-bind:checked="isAutoReloading"
                                       @change="onAutoReloadingChangedClick($event.target.checked)"
                                />
                            </label>
                        </div>
                    </section>
                    <section id="quick-select-section">
                        <h1>Quick select</h1>
                        <div>
                            <ul class="clear-list">
                                <li class="givenTimeItem" v-for="time in quickSelectTimesConverted">
                                    <span v-bind:class="isFetchingData ? '' : 'clickable'" v-on:click="onSelectQuickSelectTime(time)">{{time.toHumanDescription()}}</span>
                                </li>
                            </ul>
                        </div>
                    </section>
                    <section id="auto-reload-section">
                    </section>
                </div>
            </div>
        </MenuComponent>
    </div>
</template>


<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import {HumanTimeRange} from '../../libs/HumanTimeRange';
    import MenuComponent from '../common/MenuComponent.vue';
    import {TimeRange} from '../../libs/TimeRange';
    import Moment from 'moment';
    import Timer = NodeJS.Timer;

    @Component({
        components: {
            MenuComponent,
        },
    })
    export default class RangeTimePicker extends Vue {
        // A list of preselectable time ranges
        private static quickSelectTimes: string[] = [
            '30s', '1m', '3m', '5m', '10m', '30m', '1h', '6h',
        ];

        private humanFromTime: string = this.humanTimeRange.from;
        private humanToTime: string = this.humanTimeRange.to;
        private freshnessDurationUpdate: number = Date.now();
        private runningAutoReloadTimeout?: Timer;

        // Maps all quickSelectTimes to there human time ranges
        private quickSelectTimesConverted = RangeTimePicker.quickSelectTimes.map((x) => {
            return new HumanTimeRange('now-' + x, 'now');
        });


        protected beforeDestroy() {
            clearTimeout(this.runningAutoReloadTimeout as any);
        }

        private get timeRange(): TimeRange {
            return this.$store.state.timeRange;
        }

        private get isAutoReloading(): boolean {
            return this.$store.state.isAutoReloading;
        }

        private get humanTimeRange(): HumanTimeRange {
            return this.$store.state.humanTimeRange;
        }

        private async setHumanTimeRange(humanTimeRange: HumanTimeRange) {
            await this.$store.dispatch('triggerLoadHumanTimeRange', humanTimeRange);
        }

        private toggleMenu() {
            (this.$refs.menu as MenuComponent).toggle();
        }

        private get isFetchingData(): boolean {
            this.freshnessDurationUpdate = Date.now();
            return this.$store.state.fetchingDataCount !== 0;
        }

        private get freshnessDuration(): string {
            const inSec = Math.round(this.timeRange.getDifference() / 1000);
            this.freshnessDurationUpdate = Date.now();
            return `${inSec}s`;
        }

        private get freshnessStartOffset(): string {
            const inSec = Math.round(Moment(this.freshnessDurationUpdate).diff(this.timeRange.to) / 1000);
            return `${-inSec}s`;
        }

        private async reloadHumanTimeRange() {
            await this.onApply();
        }

        private async onApply() {
            await this.setHumanTimeRange(new HumanTimeRange(this.humanFromTime, this.humanToTime));
        }

        private onSelectQuickSelectTime(value: HumanTimeRange) {
            if (this.isFetchingData) {
                return;
            }

            this.humanFromTime = value.from;
            this.humanToTime = value.to;
            this.onApply();
        }

        // Writes the current timerange as an absolute unix timestamp
        private onToAbs() {
            this.humanFromTime = this.timeRange.from.unix().toString();
            this.humanToTime = this.timeRange.to.unix().toString();
        }

        @Watch('humanTimeRange')
        private onHumanTimeRangeChanged() {
            this.humanFromTime = this.humanTimeRange.from;
            this.humanToTime = this.humanTimeRange.to;
        }

        private onAutoReloadingChangedClick(newValue: boolean) {
            this.$store.commit('setAutoReload', newValue);
            if (!newValue) {
                // Remove pending timeout
                clearTimeout(this.runningAutoReloadTimeout as any);
            }
        }

        @Watch('isAutoReloading', {immediate: true})
        private async internalAutoReload() {
            if (!this.isAutoReloading) {
                clearTimeout(this.runningAutoReloadTimeout as any);
                return;
            }
            await this.reloadHumanTimeRange();
            this.runningAutoReloadTimeout = setTimeout(() => this.internalAutoReload(), 2500) as any;
        }
    }
</script>


<style scoped>
    .icon--refresh {
        background-image: url("../../assets/refresh.svg");
    }

    #timePicker {
        position: absolute;
        top: 55px;
        right: 0;
        z-index: 1;
    }

    .spin {
        animation: spin 1s infinite linear;
    }

    .spin--pause {
        animation-play-state: paused;
    }

    @-webkit-keyframes spin {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(359deg);
        }
    }

    .rangeTimePickerInner {
        display: flex;
        padding: 10px;
    }

    .rangeTimePickerInner label {
        display: block;
    }

    #custom-range-section {
        margin-right: 30px;
    }

    .givenTimeItem {
        margin-bottom: 3px;
    }

    .reload-button {
        display: flex;
        justify-content: center;
        align-items: center;
    }


    @keyframes fade-out {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }

    .data-freshness-indicator {
        position: absolute;
        display: block;
        border-radius: 50%;
        height: 5px;
        width: 5px;
        background-color: black;
        opacity: 0;
    }

    .data-freshness-indicator--animation {
        animation: fade-out 0s cubic-bezier(0.19, 0.85, 0.15, 0.7) 0s 1 forwards;
    }

    .button-group {
        margin: 2px;
    }

    .button-group button {
        margin: 0;
    }

    .autoreload-settings {
        margin-top: 10px;
    }

    .autoreload-glow {
        box-shadow: 0 0 10px 0 red;
    }

</style>
