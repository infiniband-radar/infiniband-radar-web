<template>
    <div class="infoPanel" :class="{ scroll: !$route.meta.hideScrollBar }">
        <keep-alive>
            <router-view v-if="$route.meta.keepAlive"></router-view>
        </keep-alive>
        <router-view v-if="!$route.meta.keepAlive"></router-view>
        <FlotPlotTooltip/>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import NavBar from './NavBar.vue';
    import FlotPlotTooltip from './common/FlotPlotTooltip.vue';

    @Component({
        components: {
            FlotPlotTooltip,
            NavBar,
        },
    })
    export default class InfoPanel extends Vue {
    }
</script>

<style scoped>
    .infoPanel {
        background-color: #ffffff;
    }
    .infoPanel {
        width: 100%;
    }

    .infoPanel.scroll {
        display: flex;
        flex-direction: column;
    }

    .infoPanel.scroll > :not(.infoPanelTopBar, .navBar) {
        overflow-y: scroll;
        flex: 1 1 auto;
    }

</style>
