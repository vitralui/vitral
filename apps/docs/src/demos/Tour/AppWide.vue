<script setup lang="ts">
import { Button, useGlobalTour } from '@vitral/vue';

// In an application this sits where the tour is started — a help menu, a
// first visit — and every page reaches the same tour with `useGlobalTour()`.
// Defaults for every tour go in the plugin:
//   app.use(Vitral, { tour: { showProgress: true, progressStyle: 'dots', dismissableMask: false } })
const tour = useGlobalTour();

function start() {
    tour.setSteps([
        { element: '#vt-app-tour-inbox', popover: { title: 'Inbox', description: 'Everything addressed to you. On another page, the same tour would carry on.' } },
        { element: '#vt-app-tour-reports', popover: { title: 'Reports', description: 'The tour is the app’s, not this component’s: it ends when it is finished or the app goes away.' } }
    ]);
    tour.drive();
}
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
        <Button id="vt-app-tour-inbox" label="Inbox" icon="bell" variant="outlined" severity="secondary" />
        <Button id="vt-app-tour-reports" label="Reports" icon="file" variant="outlined" severity="secondary" />
        <Button label="Start the app tour" icon="play" variant="text" @click="start" />
    </div>
</template>
