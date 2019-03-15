<template>
    <div class="foldableHostElement">
        <Collapsible ref="collapsible">
            <FoldableHostElementStaticInfo slot="info" class="host-info" :host="host" :highlightQuery="highlightQuery"/>
            <PortList class="port-list" :host="host" :highlightQuery="highlightQuery"/>
        </Collapsible>
    </div>
</template>

<script lang="ts">
    import {Component, Prop} from 'vue-property-decorator';
    import {TopologyHost} from '../../../../../common/models/Client/TopologyTreeModels';
    import Collapsible from '../CollapsibleComponent.vue';
    import PortList from './PortList.vue';
    import FoldableElementBase from './FoldableElementBase.vue';
    import FoldableHostElementStaticInfo from './FoldableHostElementStaticInfo.vue';

    @Component({
        components: {
            FoldableHostElementStaticInfo,
            PortList,
            Collapsible,
        },
    })
    export default class FoldableHostElement extends FoldableElementBase {

        @Prop()
        public host!: TopologyHost;

        /**
         * Will collapse(close) the element and the underlying elements
         */
        public collapse() {
            (this.$refs.collapsible as Collapsible).collapse();
        }
    }
</script>

<style scoped>

    .host-info {
        display: inline-flex;
    }

    .host-info > * {
        display: inline-block;
        align-self: center;
    }

    .foldableHostElement:not(:first-child) {
        border-top: 1px solid black;
    }

    .port-list {
        border-top: 1px dashed black;
        border-left: 1px dashed black;
        margin-top: 7px;
        margin-left: 20px;
    }

</style>