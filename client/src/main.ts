import Vue from 'vue';
import App from './App.vue';
import { router } from './modules/router';
import store from './modules/store';
import EventBus from './modules/EventBus.vue';
import * as moment from 'moment';

import 'jquery';
import 'flot/jquery.flot';
import 'flot/jquery.flot.time';
import 'flot/jquery.flot.crosshair';
import 'flot/jquery.flot.selection';

import './3dparty/flot/jquery.flot.byte';

// Add and use a precise time format
// Otherwise it would show: 'a few seconds' instead of '3 seconds'
moment.defineLocale('precise-en', {
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : '%d seconds',
        ss : '%d seconds',
        m : '%d minute',
        mm : '%d minutes',
        h : '%d hour',
        hh : '%d hours',
        d : '%d day',
        dd : '%d days',
        M : '%d month',
        MM : '%d months',
        y : '%d year',
        yy : '%d years',
    },
});

Vue.config.productionTip = false;

// Add event bus
Vue.prototype.$bus = new EventBus({
    store,
});


/**
 * Vue filter:
 * A filter that highlights parts of rawText that match the searchQuery (not case sensitive)
 * @param {String} rawText The raw text
 * @param {String} searchQuery The search input
 * @returns {String} The rawText as HTML snippet. The highlighted Text is surrounded by <span class="highlight">
 */
Vue.prototype.highlight = function highlight(rawText: string, searchQuery: string): string {
    if (!searchQuery || !searchQuery.length) {
        return rawText;
    }

    const check = new RegExp(searchQuery, 'ig');
    return String(rawText).replace(check, (matchedText) => {
        return (`<span class="highlight">${matchedText}</span>`);
    });
};



new Vue({
    router,
    store,
    render: (h) => h(App),
}).$mount('#app');

