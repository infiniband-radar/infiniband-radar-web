<template>
    <div class="fabricView">
        <VisMap id="visMap"></VisMap>
        <div id="rightSection">
            <NavBar id="navBar"></NavBar>
            <InfoPanel id="infoPanel"></InfoPanel>
        </div>
        <ChangeOverlay v-if="$store.state.showChangeOverlay"/>
    </div>
</template>

<script lang="ts">
    import { Component, Vue, Prop } from 'vue-property-decorator';
    import VisMap from '@/components/VisMap.vue';
    import InfoPanel from '@/components/InfoPanel.vue';
    import NavBar from '@/components/NavBar.vue';
    import ChangeOverlay from '../components/ChangeOverlay.vue';

    @Component({
        components: {
            ChangeOverlay,
            VisMap,
            InfoPanel,
            NavBar,
        },
    })
    export default class FabricView extends Vue {
    }
</script>

<style scoped>
    .fabricView {
        display: flex;
        height: 100%;
    }

    #visMap {
        width: 75%;
        border-right: 2px solid var(--border-gray);
        background-color: white;
    }

    #rightSection {
        min-width: 460px;
        width: calc(25% - 2px);
        height: 100%;
        display: flex;
        flex-flow: column;
    }

    #rightSection > #navBar {
        flex: 0 1 auto;
        height: 50px;
    }

    #rightSection > #infoPanel {
        flex: 1 1 auto;
        height: calc(100% - 50px);
    }
</style>
