<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ToggleSwitch',
    category: 'Form',
    description:
        "A header above, a pill that slides, and on/off content beside it. Underneath is a native checkbox with the WAI-ARIA switch role: Space toggles, the header names it, and the on/off text is hidden from screen readers because the state is already announced."
};
</script>

<script setup lang="ts">
import { ToggleSwitch } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const wifi = ref(true);
const bluetooth = ref(false);
const dark = ref(false);
const sync = ref(false);
</script>

<template>
    <DemoSection title="Header and state" description="With `show-state-label`, the locale's On/Off is shown beside the switch.">
        <ToggleSwitch v-model="wifi" label="Wi-Fi" show-state-label />
        <ToggleSwitch v-model="bluetooth" label="Bluetooth" show-state-label />
    </DemoSection>
    <DemoSection title="Custom content" description="Content shown beside the switch for each state. The second switch has no header, so it is named with aria-label.">
        <ToggleSwitch v-model="dark" label="Appearance" on-label="Dark" off-label="Light" />
        <ToggleSwitch v-model="sync" aria-label="Sync" on-label="Syncing" off-label="Paused" />
    </DemoSection>
    <DemoSection title="States">
        <ToggleSwitch :model-value="false" label="Invalid" invalid show-state-label />
        <ToggleSwitch :model-value="false" label="Disabled" disabled show-state-label />
        <ToggleSwitch :model-value="true" label="Disabled on" disabled show-state-label />
    </DemoSection>
</template>
