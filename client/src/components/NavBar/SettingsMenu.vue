<template>
    <div class="settingsMenu">
        <MenuComponent ref="menu">
            <div slot="static">
                <button class="button button--gray icon icon--gear"
                        @click="toggleMenu"
                        title="Settings menu"
                ></button>
            </div>
            <div class="card box-shadow settings-menu-content">
                <SettingsMenuInner/>
            </div>
        </MenuComponent>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import MenuComponent from '../common/MenuComponent.vue';
    import SettingsMenuInner from './SettingsMenuInner.vue';

    @Component({
        components: {
            SettingsMenuInner,
            MenuComponent,
        },
    })
    export default class SettingsMenu extends Vue {

        private toggleMenu() {
            (this.$refs.menu as MenuComponent).toggle();
        }
    }
</script>

<style scoped>
    .icon--gear {
        background-image: url("../../assets/gear.svg");
    }

    .settings-menu-content {
        position: absolute;
        top: 55px;
        right: 0;
        z-index: 1;
    }

</style>