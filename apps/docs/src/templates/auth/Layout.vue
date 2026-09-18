<script setup lang="ts">
import { compass } from '@vitral/icons';
import { Select } from '@vitral/vue';
import { computed } from 'vue';
import { provideTemplate } from '../kit/context';
import AuthShell from '../kit/AuthShell.vue';
import { screens } from './screens';

/**
 * The five screens are variants of one moment rather than places in an
 * application, so the shell carries no navigation and the gallery's own screen
 * picker is repeated here as a select: it is how you compare them.
 */
const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'signin' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const options = screens.map((entry) => ({ label: entry.name, value: entry.id }));
// The split screen and the landing page draw to the edges; the cards keep their margins.
const bleed = computed(() => screen.value === 'split');
</script>

<template>
    <AuthShell brand="Meridian" :brand-icon="compass" :bleed="bleed">
        <template #actions>
            <Select v-model="screen" :options="options" option-label="label" option-value="value" size="small" aria-label="Which sign-in screen" />
        </template>
        <component :is="current.component" />
    </AuthShell>
</template>
