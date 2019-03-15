<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import {TopologyElement} from '../../../common/models/Client/TopologyTreeModels';

    @Component({})
    export default class EventBus extends Vue {

        public readonly eventNameFocusSelectedElement = 'focusSelectedElement';

        public readonly eventNameShowEntireNetwork = 'showEntireNetwork';

        public focusSelectedElement() {
            this.$emit(this.eventNameFocusSelectedElement);
        }

        public showEntireNetwork() {
            this.$emit(this.eventNameShowEntireNetwork);
        }

        public async selectAndFocusElement(element?: TopologyElement) {
            await this.$store.dispatch('selectElement', element);
            this.focusSelectedElement();
        }
    }
</script>
