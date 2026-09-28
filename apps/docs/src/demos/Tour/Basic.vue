<script setup lang="ts">
import { share as shareIcon } from '@vitral/icons';
import { Button, InputText, Tour, type TourStep } from '@vitral/vue';
import { ref } from 'vue';

const open = ref(false);
const create = ref<{ $el: HTMLElement } | null>(null);
const search = ref<{ $el: HTMLElement } | null>(null);
const share = ref<{ $el: HTMLElement } | null>(null);

const steps: TourStep[] = [
    { popover: { title: 'Welcome', description: 'A quick look at the three things you will use most. It takes a minute.' } },
    { element: () => create.value, popover: { title: 'Create', description: 'Starts a new document from scratch or from a template.' } },
    { element: () => search.value, popover: { title: 'Search', description: 'Finds documents, people and settings.', side: 'bottom', align: 'center' } },
    { element: () => share.value, popover: { title: 'Share', description: 'Invites people, with the access you choose.', side: 'left', align: 'center' } }
];
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
            <Button ref="create" label="New" icon="plus" />
            <InputText ref="search" placeholder="Search" aria-label="Search" style="flex: 1 1 12rem" />
            <Button ref="share" label="Share" :icon="shareIcon" variant="outlined" severity="secondary" />
        </div>
        <Button label="Start the tour" icon="play" variant="text" style="align-self: flex-start" @click="open = true" />
        <Tour v-model:open="open" :steps="steps" show-progress />
    </div>
</template>
