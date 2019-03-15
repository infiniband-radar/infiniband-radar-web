<template>
    <div class="globalMetric card box-shadow" :class="{'not-visible': !displayGlobalMetric}">
        <div class="diagram">
            <div class="networkDiagram" ref="diagram">
            </div>
            <div class="annotations" ref="annotations">
                <ChangeIndicator v-for="group in groupedChanges"
                                 :group="group"
                                 :key="group.groupTimestamp"
                                 ref="changes"/>
                <!-- v-bind:style="{'left': calculateLeftOffset(changeGroup.groupAverageTimestamp)}"  -->
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';

import $ from 'jquery';
import {FlotGlobalMetric} from '../../libs/FlotDataConverter';
import {TimeRange} from '../../libs/TimeRange';
import {ClientConfig} from '../../../../common/models/Client/ClientConfig';
import ChangeIndicator from './ChangeIndicator.vue';
import {ChangesGrouper} from '../../libs/ChangesGrouper';
import {GroupedChanges} from '../../libs/GroupedChanges';
import {ChangeOverview} from '../../../../common/models/Client/ChangeOverviews';

@Component({
    components: {
        ChangeIndicator,
    },
})
export default class GlobalMetric extends Vue {

    private plot!: jquery.flot.plot;
    private $plot!: any;

    // This variable is useful to update the vue internal getter cache
    private plotVueBoilerPlateLastUpdate = 0;

    protected mounted() {
        this.$plot = $(this.$refs.diagram);
        this.plot = $.plot(
            this.$plot,
            [[]],
            {
                series: {
                    shadowSize: 0,
                },
                yaxis: {
                    mode: 'byteRate',
                    tickDecimals: 0,
                    min: 1 / 1000, // to hide the 0 B/s
                },
                xaxis: {
                    show: true,
                    mode: 'time',
                    timezone: 'browser',
                    tickLength: 10,
                    tickSize: [1, 'day'],
                },
                lines: {
                    show: true,
                    fill: 0.5,
                    lineWidth: 1,
                },
                selection: {
                    mode: 'x',
                    minSize: 1 / 1000,
                },
                fillColor: ['#71b9db'],
                colors: ['#5d8ba1'],
            } as any);
        this.onGlobalAggregatedMetricChanged();
        this.onAllowSelectionChanged();

        $(this.$refs.diagram).bind('plotselected', this.handleManualTimeSelection);
        $(this.$refs.diagram).bind('plotunselected', this.handleManualTimeSelection);
        window.addEventListener('resize', this.redraw);

        this.plotVueBoilerPlateLastUpdate++;
    }

    protected beforeDestroy() {
        window.removeEventListener('resize', this.redraw);
        $(this.$refs.diagram).unbind('plotunselected', this.handleManualTimeSelection);
        $(this.$refs.diagram).unbind('plotselected', this.handleManualTimeSelection);
        this.plot.shutdown();
    }

    private get defaultTopologyTimestamp(): number | undefined {
        return this.$store.state.defaultTopologyTimestamp;
    }

    private get metricOfGlobalAggregatedUsage(): FlotGlobalMetric | undefined {
        return this.$store.state.metricOfGlobalAggregatedUsage;
    }

    private get groupedChanges(): GroupedChanges[] | undefined {
        this.plotVueBoilerPlateLastUpdate.toString(); // ref for vue cache
        const changes = this.$store.state.changes;
        if (!changes || !this.plot) {
            return undefined;
        }
        const minTimestamp = (this.plot.getAxes().xaxis as any).datamin;
        if (!minTimestamp) {
            return undefined;
        }

        const finalGroupedData = ChangesGrouper.groupChanges(this.filterChangesOutsideBounds(
            changes,
            minTimestamp,
        ));

        if (!this.defaultTopologyTimestamp || this.defaultTopologyTimestamp < minTimestamp) {
            const defaultChange = changes.find(
                (c: ChangeOverview) => c.timestamp === this.defaultTopologyTimestamp,
            ) as ChangeOverview;

            finalGroupedData.push({
                changes: [defaultChange],
                groupTimestamp: minTimestamp,
            });
        }

        return finalGroupedData;
    }

    private get timeRange(): TimeRange {
        return this.$store.state.timeRange;
    }

    private get isFetchingData(): boolean {
        return this.$store.state.fetchingDataCount !== 0;
    }

    private get config(): ClientConfig {
        return this.$store.state.config;
    }

    private get displayGlobalMetric(): boolean {
        this.plotVueBoilerPlateLastUpdate.toString(); // ref for vue cache
        return !!this.metricOfGlobalAggregatedUsage && !!this.$store.state.changes && this.config.displayGlobalMetric;
    }

    /**
     * Sometimes, if the fabric has not experienced any updates,
     * and the API server was not restarted recently, an out of bounds Change entry could exists
     * @param changes
     * @param minTime
     */
    private filterChangesOutsideBounds(changes: ChangeOverview[], minTime: number) {
        return changes.filter((c) => c.timestamp >= minTime);
    }

    private handleManualTimeSelection(jQueryEvent: any, selection?: {xaxis: { from: number, to: number }}) {
        if (!selection) {
            this.onTimeRangeChanged();
            return;
        }

        const from = Math.floor(selection.xaxis.from / 1000);
        const to = Math.floor(selection.xaxis.to / 1000);

        this.$store.dispatch('triggerLoadTimeRange', TimeRange.tryParse(from, to));
    }

    private async repositionChangeIndicators() {
        let changeElements: ChangeIndicator[] = this.$refs.changes as ChangeIndicator[];
        let tries;
        for (tries = 5; tries > 0 && !changeElements; tries--) {
            await Vue.nextTick();
            changeElements = this.$refs.changes as ChangeIndicator[];
        }
        if (tries === 0 && !changeElements) {
            return;
        }

        for (const element of changeElements) {
            (element.$el as HTMLDivElement).style.left = this.calculateLeftOffset(element.group.groupTimestamp);
        }
    }

    private repositionAnnotationsHolder() {
        const element = this.$refs.annotations as HTMLDivElement;
        if (!element) {
            return;
        }

        const plotOffset = this.plot.getPlotOffset();
        element.style.top = `${plotOffset.top}px`;
        element.style.height = `${this.plot.height()}px`;
    }

    private calculateLeftOffset(timestamp: number): string {
        if (!this.plot) {
            return '0';
        }

        const offset = this.plot.pointOffset({
            x: timestamp,
            y: 0,
        });
        return `${offset.left}px`;
    }

    @Watch('changes', {deep: true})
    @Watch('displayGlobalMetric')
    private async triggerRepositionChange() {
        await this.repositionChangeIndicators();
    }

    @Watch('metricOfGlobalAggregatedUsage')
    private onGlobalAggregatedMetricChanged() {
        if (!this.metricOfGlobalAggregatedUsage) {
            return;
        }

        this.plot.setData(this.metricOfGlobalAggregatedUsage);
        this.plotVueBoilerPlateLastUpdate++;

        this.redraw();
    }

    @Watch('timeRange')
    private onTimeRangeChanged() {
        this.plot.setSelection({
                xaxis: {
                    from: this.timeRange.from,
                    to: this.timeRange.to,
                },
            },
            true, /*prevent handleManualTimeSelection event*/
        );
    }

    @Watch('isFetchingData')
    @Watch('config.allowTimeRangeSelectionInGlobalMetric')
    private onAllowSelectionChanged() {
        const allow = this.config.allowTimeRangeSelectionInGlobalMetric && !this.isFetchingData;
        this.plot.getOptions().selection.allowInteraction = allow;
    }

    private redraw() {
        this.plot.resize();
        this.plot.setupGrid();
        this.plot.draw();
        this.onTimeRangeChanged();
        this.repositionAnnotationsHolder();
        this.repositionChangeIndicators();
    }
}
</script>

<style scoped>
    .globalMetric {
        transition: opacity ease 0.5s;
    }

    .globalMetric.not-visible {
        z-index: -1;
        opacity: 0;
    }

    .diagram {
        height: 80px;
        width: 100%;
    }

    .networkDiagram {
        height: 80px;
        width: 100%;
    }

    .networkDiagram,
    .annotations {
        position: absolute !important;
    }
</style>
