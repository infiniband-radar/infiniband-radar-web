<template>
    <div class="collapsibleComponent">
        <div class="static">
            <div class="collapseButton" @click="toggle" v-bind:class="{collapsed: isCollapsed}"></div>
            <section class="info-section">
                <slot name="info"></slot>
            </section>
        </div>
        <div class="content">
            <slot v-if="!isCollapsed"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
    components: {
    },
})
export default class CollapsibleComponent extends Vue {
    @Prop()
    private doNotCollapseInitially!: boolean;

    private isCollapsed: boolean = true;

    protected beforeMount() {
        if (this.doNotCollapseInitially) {
            this.isCollapsed = false;
        }
    }

    public toggle() {
        this.isCollapsed = !this.isCollapsed;
    }

    public collapse() {
        this.isCollapsed = true;
    }

    public show() {
        this.isCollapsed = false;
    }
}
</script>

<style scoped>
    .collapsibleComponent > .static {
        width: 100%;
        display: inline-flex;
    }

    .collapsibleComponent > .static > * {
        display: inline-block;
    }

    .collapsibleComponent > .static > .collapseButton {
        cursor: pointer;
        height: 20px;
        width: 20px;
        align-self: center;
        background-image: url("../../assets/minus.svg");
        background-repeat: no-repeat;
        background-size: 20px 20px;
        border: none;
        outline: none;
    }

    .collapsibleComponent > .static > .collapseButton.collapsed {
        background-image: url("../../assets/plus.svg");
    }
</style>
