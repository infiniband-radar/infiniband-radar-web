<template>
    <div>
        <div class="diagram" :class="{'has-no-data': !hasMetricData}" ref="diagram"></div>
    </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import $ from 'jquery';
import {ClientConfig} from '../../../../common/models/Client/ClientConfig';
import {FlotMetricGroup} from '../../libs/FlotDataConverter';
import {TopologyConnection, TopologyPort} from '../../../../common/models/Client/TopologyTreeModels';
import {TimeRange} from '../../libs/TimeRange';
import FlotPlotTooltip from './FlotPlotTooltip.vue';
import {isPortElement} from '../../../../common/ElementTreeTypeGuards';
import {LinkSpeedConverter} from '../../../../common/LinkSpeedConverter';
import {TopologyTreeUtils} from '../../../../common/TopologyTreeUtils';
import {RandomColorUtils} from '../../libs/RandomColorUtils';
import Moment from 'moment';

@Component({
    components: {
    },
})
export default class FlotPlot extends Vue {
    private static diagramConfig = {
        series: {
            shadowSize: 0,
            highlightColor: 'black',
        },
        yaxis: {
            mode: 'byteRate',
            tickDecimals: 0,
            min: 0.1,
            reserveSpace: true,
            labelWidth: 65,
        },
        xaxis: {
            // Now handled by customXAxisTickFormatter function
        },
        crosshair: {
            mode: 'x',
        },
        grid: {
            mouseActiveRadius: 20,
            hoverable: true,
            clickable: true,
            backgroundColor: '#f5f5f5',
        },
        selection: {
            mode: 'x',
            minSize: 1 / 1000,
        },
    };

    private static readonly toolTipYAxisConfig: any = {tickDecimals: 2};

    private plot!: jquery.flot.plot;
    private $plot!: any; // jquery Element handle

    private lastHoverState = false;

    private hasMetricData: boolean = false;
    private hasMultipleCAs: boolean = false;
    private seriesIndexToElement: Array<TopologyPort | TopologyConnection | undefined> = [];

    protected mounted() {
        this.$plot = $(this.$refs.diagram);
        this.plot = $.plot(this.$plot, [[]], FlotPlot.diagramConfig);
        (this.plot.getAxes().xaxis as any).tickGenerator = FlotPlot.customXAxisTickGenerator;
        (this.plot.getAxes().xaxis as any).tickFormatter = FlotPlot.customXAxisTickFormatter;

        this.$plot.bind('plothover', this.handleHoverOverDiagram);
        this.$plot.bind('plotclick', this.handleClickOnDiagram);
        this.$plot.bind('plotselected', this.handleManualTimeSelection);
        window.addEventListener('resize', this.handleResize);

        this.onAllowSelectionChanged();
    }

    protected beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
        this.$plot.unbind('plotselected', this.handleManualTimeSelection);
        this.$plot.unbind('plotclick', this.handleClickOnDiagram);
        this.$plot.unbind('plothover', this.handleHoverOverDiagram);

        this.plot.shutdown();

        if (this.lastHoverState) {
            const tooltip = FlotPlotTooltip.instance;
            if (tooltip) {
                tooltip.stop();
            }
        }

    }

    public setData(data?: FlotMetricGroup,
                   seriesIndexToElement?: Array<TopologyPort | TopologyConnection | undefined>,
                   hasMultipleCAs = false) {
        this.plot.clearSelection();

        this.seriesIndexToElement = seriesIndexToElement || [];
        this.hasMultipleCAs = hasMultipleCAs;

        if (!data) {
            this.plot.setData([[]]);
            this.hasMetricData = false;
            this.redrawPlot();
            return;
        }

        this.plot.setData(data);
        this.setInitialColors();

        this.hasMetricData = true;

        this.rescaleAxisOfDiagram();
        this.redrawPlot();
    }

    private get config(): ClientConfig {
        return this.$store.state.config;
    }

    private get highlightedIndex(): number | undefined {
        return this.$store.state.highlightedIndex;
    }

    private get isFetchingData(): boolean {
        return this.$store.state.fetchingDataCount !== 0;
    }

    private setMaxBytes(value?: number) {
        this.plot.getAxes().yaxis.options.max = value;
        this.redrawPlot();
    }

    private redrawPlot() {
        this.plot.setupGrid();
        this.plot.draw();
    }

    private setInitialColors() {
        const convertedData = this.plot.getData();
        for (const seriesIndex of Object.keys(convertedData)) {
            const series = convertedData[seriesIndex as any];
            const element = TopologyTreeUtils.tryGetConnection(this.seriesIndexToElement[seriesIndex as any]);

            if (!element) {
                continue;
            }

            series.color = RandomColorUtils.getMetricColorForConnection(element);

            (series as any).orgColor = series.color;
        }
    }

    private handleHoverOverDiagram(jQueryEvent: any, mousePos: any, dataPoint?: jquery.flot.item) {
        const tooltip = FlotPlotTooltip.instance;
        if (!tooltip) {
            return;
        }

        if (!dataPoint) {
            if (this.lastHoverState) {
                tooltip.stop();
                this.$store.commit('setHighlightedIndex', undefined);
                this.lastHoverState = false;
            }
            return;
        }
        if (!this.lastHoverState) {
            tooltip.start();
            this.lastHoverState = true;
        }


        const offset = 10;
        const xAxis = this.plot.getAxes().xaxis;
        const yAxis = this.plot.getAxes().yaxis;
        const values: number[] = dataPoint.datapoint!;

        if (!xAxis.tickFormatter || !yAxis.tickFormatter) {
            return;
        }

        const xTextValue = xAxis.tickFormatter(values[0], xAxis);
        const yTextValue = yAxis.tickFormatter(values[1], FlotPlot.toolTipYAxisConfig);

        const selectedElement = this.seriesIndexToElement[dataPoint.seriesIndex];
        this.$store.commit('setHighlightedIndex', dataPoint.seriesIndex);
        tooltip.update(xTextValue, yTextValue, this.hasMultipleCAs, selectedElement);
        this.plot.draw();
    }

    private handleClickOnDiagram(jQueryEvent: any, mousePos: any, dataPoint?: jquery.flot.item) {
        if (!this.config.selectConnectionInDiagramWhenClicked) {
            return;
        }

        if (!dataPoint) {
            return;
        }

        const selectedElement = this.seriesIndexToElement[dataPoint.seriesIndex];
        if (!isPortElement(selectedElement)) {
            return;
        }

        this.$store.dispatch('selectElement', selectedElement.connection);
    }

    @Watch('isFetchingData')
    @Watch('config.allowTimeRangeSelectionInGlobalMetric')
    private onAllowSelectionChanged() {
        const allow = this.config.allowTimeRangeSelectionInMetric && !this.isFetchingData;
        this.plot.getOptions().selection.allowInteraction = allow;
    }

    @Watch('highlightedIndex')
    private onHighlightedIndexChanged() {
        const allSeries = this.plot.getData();
        const highlightedIndex = this.highlightedIndex;
        if (highlightedIndex === undefined) {
            allSeries.forEach((series: any) => {
                series.color = series.orgColor;
            });
        } else {
            for (const tmpIndex of Object.keys(allSeries)) {
                const index = Number(tmpIndex);
                if (index === highlightedIndex) {
                    allSeries[index].color = (allSeries[index] as any).orgColor;
                } else {
                    allSeries[index].color = 'rgba(0,0,0,0.1)';
                }
            }
        }
        this.plot.draw();
    }

    private handleManualTimeSelection(jQueryEvent: any, selection?: {xaxis: { from: number, to: number }}) {
        if (!selection) {
            return;
        }

        const from = Math.floor(selection.xaxis.from / 1000);
        const to = Math.floor(selection.xaxis.to / 1000);

        this.$store.dispatch('triggerLoadTimeRange', TimeRange.tryParse(from, to));
    }

    private handleResize() {
        this.plot.resize();
        this.plot.setupGrid();
        this.plot.draw();
    }

    @Watch('config.scaleMetricAlwaysToMax')
    private onConfigScaleMetricAlwaysToMaxChanged() {
        this.rescaleAxisOfDiagram();
    }


    private rescaleAxisOfDiagram() {
        if (!this.config.scaleMetricAlwaysToMax) {
            this.setMaxBytes();
            return;
        }

        let bestSpeed: number | undefined;

        for (const element of this.seriesIndexToElement) {
            const connection = TopologyTreeUtils.tryGetConnection(element);

            if (!connection) {
                continue;
            }

            const speed = LinkSpeedConverter.getMaxLinkSpeed(connection.link);
            if (!bestSpeed || speed > bestSpeed) {
                bestSpeed = speed;
            }
        }

        this.setMaxBytes(bestSpeed);
    }

    private static customXAxisTickGenerator(axis: any): any[] {
        const totalTimeRangeMs = axis.datamax - axis.datamin;

        return [
            axis.datamin,
            Math.trunc(axis.datamin + totalTimeRangeMs * 0.25),
            Math.trunc(axis.datamin + totalTimeRangeMs * 0.50),
            Math.trunc(axis.datamin + totalTimeRangeMs * 0.75),
            axis.datamax,
        ].map((x) => [x, axis.tickFormatter(x, axis, totalTimeRangeMs < 60 * 1000)]);
    }

    private static customXAxisTickFormatter(timestamp: number, axis: any, isDetails = true) {
        if (isDetails) {
            return Moment(timestamp || 0).format('HH:mm:ss');
        } else {
            return Moment(timestamp || 0).format('HH:mm');
        }
    }
}
</script>

<style scoped>
    .diagram {
        height: 150px;
        width: 100%;
        cursor: crosshair;
    }

    .tooltip {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        background-color: #0a72e2;
    }
</style>

<style>
    .has-no-data .flot-overlay {
        /* Avoid the gray flash if a new Element was selected */
        transition: background-color 250ms;
    }
    .has-no-data .flot-overlay {
        background-color: rgba(0, 0, 0, 0.25);
    }

</style>
