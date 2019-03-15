<template>

</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {TopologyElement} from '../../../../../common/models/Client/TopologyTreeModels';
    import {ClientConfig} from '../../../../../common/models/Client/ClientConfig';

    @Component({
        components: {
        },
    })
    export default class FoldableElementBase extends Vue {
        @Prop()
        public highlightQuery?: string;

        protected selectElement(element?: TopologyElement) {
            this.$bus.selectAndFocusElement(element);
        }

        protected get config(): ClientConfig {
            return this.$store.state.config;
        }
    }
</script>
