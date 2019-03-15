<template>
    <div id="app">
        <router-view v-if="isApiReachable"/>
        <div v-else class="apiError">
            <center>
                <h1>:(</h1>
                <p>
                    The API seems to be offline.<br>
                    Verify that the API server is running and already started up.<br>
                </p>
            </center>
        </div>
        <div id="versionIndicator">
            <span :title="gitLastCommit">InfiniBand Radar | Version: <b>{{version}}</b></span>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';

@Component({
    components: {
    },
})
export default class App extends Vue {
    private get version(): string {
        return VERSION;
    }

    private get gitLastCommit(): string {
        return LAST_GIT_COMMIT;
    }

    private get isApiReachable(): boolean {
        return this.$store.state.isApiReachable;
    }
}
</script>
<style scoped>
    #app {
        font-family: 'Roboto', sans-serif !important;
        /*font-family: 'Avenir', Helvetica, Arial, sans-serif;*/
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        height: 100%;
    }

    #app > #versionIndicator {
        font-size: 10px;
        position: fixed;
        left: 0;
        bottom: 0;
    }

    .apiError h1 {
        margin: 0;
        font-size: 30vh;
    }
</style>
