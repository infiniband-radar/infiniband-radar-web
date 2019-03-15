<template>
    <div>
        <div class="innerTooltip card" ref="innerTooltip" v-show="visible">
            <span class="time">{{time}}</span>
            <br>
            <span class="bandwidth">{{bandwidth}}</span>
            <br>
            <span v-if="port">Port: {{port.portNumber}}
                <br>
                <span v-if="port && hasMultipleCAs">{{port.ca.description}}</span>
            </span>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import {TopologyConnection, TopologyPort} from '../../../../common/models/Client/TopologyTreeModels';
    import {isPortElement} from '../../../../common/ElementTreeTypeGuards';

    @Component({
        components: {
        },
    })
    export default class FlotPlotTooltip extends Vue {

        public static instance?: FlotPlotTooltip;

        private static offset = 10;

        private time: string = '';

        private bandwidth: string = '';

        private element?: TopologyPort | TopologyConnection = null as any as undefined;

        private visible = false;

        private hasMultipleCAs = false;

        private $infoPanel!: HTMLDivElement;

        protected mounted() {
            if (FlotPlotTooltip.instance && FlotPlotTooltip.instance !== this) {
                FlotPlotTooltip.instance.$destroy();
            }
            FlotPlotTooltip.instance = this;

            this.$infoPanel = document.querySelector('.infoPanel') as HTMLDivElement;
            this.$infoPanel.addEventListener('mousemove', this.onMouseMove);
        }

        protected beforeDestroy() {
            this.$infoPanel.removeEventListener('mousemove', this.onMouseMove);
        }

        public start() {
            this.visible = true;
        }

        public stop() {
            this.visible = false;
        }

        public update(time: string, bandwidth: string, hasMultipleCAs: boolean, element?: TopologyPort | TopologyConnection) {
            this.time = time;
            this.bandwidth = bandwidth;
            this.element = element;
            this.hasMultipleCAs = hasMultipleCAs;
        }

        private get port(): TopologyPort | undefined {
            return isPortElement(this.element) ? this.element : undefined;
        }

        private onMouseMove(e: MouseEvent) {
            if (!this.visible) {
                return;
            }
            const mouseX = e.pageX;
            const mouseY = e.pageY;

            const element = this.$refs.innerTooltip as HTMLDivElement;

            const width = element.getBoundingClientRect().width;
            let left = mouseX + FlotPlotTooltip.offset;
            if (left + width > window.innerWidth) {
                left -= 2 * FlotPlotTooltip.offset + width;
            }

            element.style.left = `${left}px`;
            element.style.top = `${mouseY + FlotPlotTooltip.offset}px`;
        }
    }
</script>

<style scoped>
    .innerTooltip {
        position: absolute;
    }

    .time {
        font-weight: bold;
    }
</style>
