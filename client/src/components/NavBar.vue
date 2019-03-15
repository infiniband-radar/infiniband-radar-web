<template>
    <div class="navBar">
        <div class="buttons">
            <div class="navigation-button">
                <button v-if="isElementSelected"
                        @click="goToSearchOverview"
                        class="button button--gray icon icon--search"
                        title="Back to search"></button>
                <router-link v-else to="/fabric"
                             tag="button"
                             class="button button--gray"
                             title="Back to fabric list">Fabric List</router-link>
            </div>
            <QuickActionMenu/>
            <SettingsMenu/>
            <RangeTimePicker class="time-range-picker"/>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import RangeTimePicker from './NavBar/RangeTimePicker.vue';
    import SettingsMenu from './NavBar/SettingsMenu.vue';
    import QuickActionMenu from './NavBar/QuickActionMenu.vue';
    import {ClientConfig} from '../../../common/models/Client/ClientConfig';


    @Component({
        components: {
            QuickActionMenu,
            SettingsMenu,
            RangeTimePicker,
        },
    })
    export default class NavBar extends Vue {

        private goToSearchOverview() {
            this.$store.dispatch('selectElement', null);
            if (this.config.autoZoomOutOnBackToSearch) {
                this.$bus.showEntireNetwork();
            }
        }

        private get config(): ClientConfig {
            return this.$store.state.config;
        }

        private get isElementSelected(): boolean {
            return !!this.$store.state.selectedElement;
        }

    }
</script>

<style scoped>
    .navBar {
        background-color: rgba(239, 239, 239, 0.8);
    }

    .buttons {
        display: inline-flex;
        width: 100%;
    }

    .time-range-picker {
        margin-left: auto;
    }

    .icon--search {
        background-image: url("../assets/search.svg");
        width: 33px;
        min-width: 33px;
    }

    .navigation-button {
        width: 90px;
    }

</style>

