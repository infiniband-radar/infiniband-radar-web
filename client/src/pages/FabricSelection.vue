<template>
    <div class="fabricSelection" :class="clickedLink ? 'is-fetching-data' : ''">
        <section id="logout-section" v-show="requiresLogin">
            <button class="button button--red" @click="logout">Logout</button>
        </section>
        <div class="center-content">
            <div class="card box-shadow">
                <ul class="clear-list">
                    <li v-for="fabric of fabrics" :key="fabric.fabricId">
                        <router-link
                                :to="`/fabric/${fabric.fabricId}`"
                                @click.native="onClickRouterLink"
                                class="fabric-link">
                            <div class="fabric">
                                <div class="farbic-image" v-bind:style="{'background-image': `url(${fabric.image})`}"></div>
                                <div class="fabric-info">
                                    <p class="fabric-name">{{fabric.name}}</p>
                                </div>
                            </div>
                        </router-link>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import {ApiClient} from '../libs/ApiClient';
import {FabricModel} from '../../../common/models/Client/FabricModel';

@Component({
    components: {
    },
})
export default class FabricSelection extends Vue {

    private clickedLink = false;

    private requiresLogin = false;

    protected async beforeCreate() {
        this.$store.dispatch('ensureFabricList');
        this.requiresLogin = !!(await ApiClient.getLoginConfig()).loginType;
    }

    private get fabrics(): FabricModel[] {
        return this.$store.state.fabrics;
    }

    private onClickRouterLink() {
        this.clickedLink = true;
    }

    private logout() {
        ApiClient.removeToken();
        this.$router.push('/login');
    }

}
</script>

<style scoped>
    .fabricSelection,
    .fabricSelection > .center-content {
        height: 100%;
    }

    li > a {
        display: block;
    }

    li > a:hover {
        background-color: var(--gray);
    }

    li > a > * {
        display: inline-block;
    }

    .fabric {
        display: flex;
    }

    .is-fetching-data {
        cursor: wait;
    }

    .is-fetching-data .fabric-link {
        background-color: #d4d4d4;
        cursor: wait;
    }

    .fabric-info {
        min-width: 200px;
        display: inline-block;
    }

    .fabric-name {
        margin: 0;
        alignment-baseline: center;
        display: inline-block;
        line-height: 80px;
        width: 100%;
        text-align: center;
        font-size: 30px;
        color: black;
    }

    .farbic-image {
        height: 80px;
        width: 80px;
        background-size: 80px 80px;
        border-right: 1px solid var(--border-gray);
    }

    li:not(:last-child) {
        border-bottom: 1px solid var(--border-gray);
    }

    #logout-section {
        position: absolute;
        top: 0;
        right: 0;
    }
</style>
