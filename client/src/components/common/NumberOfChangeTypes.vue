<template>
    <span class="numberOfChangeTypes">
        <span class="added">{{overviewDetails.added}}</span>/<span class="modified">{{overviewDetails.modified}}</span>/<span class="removed">{{overviewDetails.removed}}</span>
    </span>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {ChangeOverviewDetails} from '../../../../common/models/Client/ChangeOverviews';

    @Component({
        components: {
        },
    })
    export default class NumberOfChangeTypes extends Vue {

        @Prop()
        private overviewDetails!: ChangeOverviewDetails;
    }
</script>

<style scoped>
</style>
