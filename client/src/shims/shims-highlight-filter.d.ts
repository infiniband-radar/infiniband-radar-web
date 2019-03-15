import Vue from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        highlight: (rawText: string, searchQuery: string) => string;
    }
}
