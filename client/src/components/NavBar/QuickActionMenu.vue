<template>
    <div class="quickActionMenu">
        <div>
            <div class="double-buttons">
                <button class="button button--gray icon--bordered icon--zoomOut"
                        @click="zoomOutCamera"
                        title="Zoom out"
                ></button>
                <button :disabled="!$store.state.selectedElement"
                        class="button button--gray icon--bordered icon--zoomIn"
                        @click="focusCamera"
                        title="Zoom into selected element"
                ></button>
            </div>
            <!--
            <div class="double-buttons">
                <button title="Move time window to the left side by 1/4"><</button>
                <button title="Expand the time window by 1/4">_</button>
                <button title="Move time window to the right side by 1/4">></button>
            </div>
            -->
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';

    @Component({
        components: {
        },
    })
    export default class QuickActionMenu extends Vue {

        private focusCamera() {
            this.$bus.focusSelectedElement();
        }

        private zoomOutCamera() {
            this.$bus.showEntireNetwork();
        }

    }
</script>

<style scoped>
    .quickActionMenu {
        margin: 0 10px;
    }

    .icon--bordered {
        display: block;
        height: 32px;
        width: 32px;
        margin: 2px;
        border: 1px solid;
        background-size: 23px 23px;
        background-repeat: no-repeat;
        background-position: center;
    }

    .icon--zoomOut {
        background-image: url('../../assets/fullscreen_thick.svg');
    }

    .icon--zoomIn {
        background-image: url('../../assets/crosshair_thick.svg');
    }

    .icon--zoomIn:disabled {
        background-image: url('../../assets/crosshair_thin.svg');
    }

    .double-buttons {
        display: inline-flex;
        justify-content: space-between;
        width: 100%;
    }

    .double-buttons > .buttons {
        display: block;
    }
</style>
