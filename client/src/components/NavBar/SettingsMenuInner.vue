<template>
    <div class="settingsMenuInner">
        <div class="general-options">
            <h1>
                Settings
            </h1>
            <div class="reset-option">
                <button class="button button--gray" @click="resetSettings" title="Reset all settings">
                    <span class="icon icon--tiny icon--reset"></span>
                </button>
            </div>
        </div>
        <table>
            <tbody>
            <tr>
                <td><span class="setting-section">Map</span></td>
            </tr>
            <tr>
                <td>Enable physics simulation</td>
                <td><input type="checkbox" v-model="config.enableMapPhysicsSimulation"/></td>
            </tr>
            <tr>
                <td>Tint connection by LinkType</td>
                <td><input type="checkbox" v-model="config.showConnectionColorsAsLinkType"/></td>
            </tr>

            <tr>
                <td><span class="setting-section">SideBar</span></td>
            </tr>
            <tr>
                <td>Show CA description in search</td>
                <td><input type="checkbox" v-model="config.showHostCaGuidsInSearchList"/></td>
            </tr>
            <tr>
                <td>Always show CA description in port list</td>
                <td><input type="checkbox" v-model="config.alwaysDisplayCaDescriptionInPortList"/></td>
            </tr>
            <tr>
                <td>Always show CA description in links</td>
                <td><input type="checkbox" v-model="config.alwaysDisplayHostCaDescOnButtons"/></td>
            </tr>
            <tr>
                <td>Auto zoom out when click <i>search back to search</i> button</td>
                <td><input type="checkbox" v-model="config.autoZoomOutOnBackToSearch"/></td>
            </tr>

            <tr>
                <td><span class="setting-section">Metrics</span></td>
            </tr>
            <tr>
                <td>Scale metrics always to max possible bandwidth</td>
                <td><input type="checkbox" v-model="config.scaleMetricAlwaysToMax"/></td>
            </tr>
            <tr>
                <td>Allow TimeRange selection in metric</td>
                <td><input type="checkbox" v-model="config.allowTimeRangeSelectionInMetric"/></td>
            </tr>
            <tr>
                <td>Select connection in diagram when clicked</td>
                <td><input type="checkbox" v-model="config.selectConnectionInDiagramWhenClicked"/></td>
            </tr>
            <tr>
                <td>Highlight series when hover over it</td>
                <td><input type="checkbox" v-model="config.highlightSeriesWhenHoverOverIt"/></td>
            </tr>

            <tr>
                <td><span class="setting-section">GlobalMetric</span></td>
            </tr>
            <tr>
                <td>Display global metric</td>
                <td><input type="checkbox" v-model="config.displayGlobalMetric"/></td>
            </tr>
            <tr>
                <td>Allow TimeRange selection in global metric (<b>be careful</b>)</td>
                <td><input type="checkbox" v-model="config.allowTimeRangeSelectionInGlobalMetric"/></td>
            </tr>

            <tr>
                <td><span class="setting-section">Changes</span></td>
            </tr>
            <tr>
                <td>Show help menu in change overlay</td>
                <td><input type="checkbox" v-model="config.showChangeOverlayTutorial"/></td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import MenuComponent from '../common/MenuComponent.vue';
import {ClientConfig} from '../../../../common/models/Client/ClientConfig';

@Component({
    components: {
        MenuComponent,
    },
})
export default class SettingsMenuInner extends Vue {
    private get config(): ClientConfig {
        return this.$store.state.config;
    }

    private resetSettings() {
        this.$store.commit('resetClientConfig');
    }
}
</script>

<style scoped>
    .settingsMenuInner {
        margin: 10px;
    }

    .general-options {
        width: 100%;
        display: inline-flex;
    }

    .setting-section {
        display: block;
        margin-top: 10px;
        font-size: 18px;
        font-weight: bold;
    }

    .reset-option {
        position: absolute;
        right: 0;
    }

    .icon--reset {
        background-image: url("../../assets/reset.svg");
    }
</style>