import EventBus from '@/modules/EventBus.vue';

declare module 'vue/types/vue' {
    interface Vue {
        $bus: EventBus;
    }
}
