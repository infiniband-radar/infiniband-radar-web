<template>
    <div class="menuComponent">
        <div ref="static">
            <slot name="static"></slot>
        </div>
        <div ref="menu">
            <slot v-if="showMenuElement"></slot>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';

    @Component({
        components: {
        },
    })
    export default class MenuComponent extends Vue {

        private showMenuElement = false;

        protected created() {
            document.addEventListener('click', this.documentClick);
            document.addEventListener('keydown', this.documentKeyDown);
        }

        protected destroyed() {
            document.removeEventListener('click', this.documentClick);
            document.removeEventListener('keydown', this.documentKeyDown);
        }

        public show() {
            this.showMenuElement = true;
        }

        public hide() {
            this.showMenuElement = false;
        }

        public toggle() {
            this.showMenuElement = !this.showMenuElement;
        }

        private documentClick(e: Event) {
            const el = this.$refs.static as Element;
            const el2 = this.$refs.menu as Element;

            const target = e.target as Element;
            if (el !== target && el2 !== target && !el.contains(target) && !el2.contains(target)) {
                this.hide();
            }
        }

        private documentKeyDown(e: KeyboardEvent) {
            if (e.code === 'Escape') {
                this.hide();
            }
        }
    }
</script>

<style scoped>
</style>
