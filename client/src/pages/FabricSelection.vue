<template>
    <div class="fabricSelection" :class="clickedLink ? 'is-fetching-data' : ''">
        <section id="logout-section" v-show="requiresLogin">
            <button class="button button--red" @click="logout">Logout</button>
        </section>
        <div class="center-content">
            <div class="card box-shadow">
                <ul class="clear-list">
                    <li v-for="fabric of displayedFabrics" :key="fabric.fabricId">
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
                    <li v-if="!displayHidden" class="show-more">
                        <p @click="displayMoreFabrics" class="clickable">Display {{hiddenFabricCount}} more</p>
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

    private displayHidden = false;

    protected async beforeCreate() {
        this.$store.dispatch('ensureFabricList');
        this.requiresLogin = !!(await ApiClient.getLoginConfig()).loginType;
    }

    private get fabrics(): FabricModel[] {
        return this.$store.state.fabrics;
    }

    private get displayedFabrics(): FabricModel[] {
        if (!this.displayHidden) {
            return this.fabrics.filter((fabric) => !fabric.hideFromInitialSelection);
        }
        return this.fabrics;
    }

    private get hiddenFabricCount(): number {
        return this.fabrics.filter((fabric) => fabric.hideFromInitialSelection).length;
    }

    private displayMoreFabrics() {
        this.displayHidden = true;
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
        font-size: 30px;
        display: flex;
    }

    .fabric-link {
        text-decoration: none;
    }

    .is-fetching-data {
        cursor: wait;
    }

    .is-fetching-data .fabric-link {
        background-color: #d4d4d4;
        cursor: wait;
    }

    .fabric-info {
        display: flex;
        min-width: 200px;
        justify-content: center;
        align-items: center;
    }

    .fabric-name {
        margin: 0;
        alignment-baseline: center;
        display: inline-block;
        width: 100%;
        text-align: center;
        color: black;
    }

    .farbic-image {
        height: 3em;
        width: 3em;
        background-size: 3em 3em;
        border-right: 1px solid var(--border-gray);
    }

    .show-more p {
        margin: 0.1em;
        padding: 0.5em;
        text-align: center;
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
