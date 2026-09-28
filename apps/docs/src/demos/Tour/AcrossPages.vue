<script setup lang="ts">
import { Button, SelectButton, Tour, type TourStep } from '@vitral/vue';
import { nextTick, ref } from 'vue';

// A stand-in for a router: three pages, one on show. With vue-router the two
// options below are `navigate: (page) => router.push(page)` and
// `currentPage: () => router.currentRoute.value.path`. Without a router,
// leave `navigate` out: the tour loads the page, and a <Tour> there picks up.
const page = ref('/inbox');
const pages = ['/inbox', '/reports', '/settings'];
const open = ref(false);

async function navigate(to: string) {
    page.value = to;
    await nextTick();
}

const steps: TourStep[] = [
    { element: '#demo-page-inbox', page: '/inbox', popover: { title: 'Inbox', description: 'Everything addressed to you. Next, the tour goes to Reports by itself.' } },
    { element: '#demo-page-reports', page: '/reports', popover: { title: 'Reports', description: 'This step is on another page: the tour went there first, then found it.' } },
    { element: '#demo-page-settings', page: '/settings', popover: { title: 'Settings', description: 'And one more page. Previous goes back the same way.' } }
];
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center">
            <SelectButton v-model="page" :options="pages" :allow-empty="false" aria-label="Page" />
            <Button label="Start the tour" icon="play" @click="open = true" />
        </div>
        <div style="padding: 1rem; border: 1px solid var(--vt-content-border-color); border-radius: 0.5rem; min-height: 6rem">
            <div v-if="page === '/inbox'" id="demo-page-inbox" style="display: inline-block; padding: 0.5rem 0.75rem">📥 Inbox — 3 new</div>
            <div v-else-if="page === '/reports'" id="demo-page-reports" style="display: inline-block; padding: 0.5rem 0.75rem">📊 Reports — Q3</div>
            <div v-else id="demo-page-settings" style="display: inline-block; padding: 0.5rem 0.75rem">⚙️ Settings</div>
        </div>
        <Tour v-model:open="open" :steps="steps" :navigate="navigate" :options="{ currentPage: () => page }" show-progress />
    </div>
</template>
