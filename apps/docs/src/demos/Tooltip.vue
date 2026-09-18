<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tooltip',
    category: 'Overlay',
    description:
        'The `v-tooltip` directive — register it with `app.directive(\'tooltip\', Tooltip)`. It shows on hover and on keyboard focus, hides on leave, blur and Escape, stays while the pointer is on it, and describes its host through `aria-describedby`.'
};
</script>

<script setup lang="ts">
import { Button, InputText, Tooltip as vTooltip } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const enabled = ref(true);
</script>

<template>
    <DemoSection title="Placement" description="Modifiers pick the side: `.top` (the default), `.bottom`, `.left`, `.right`.">
        <Button v-tooltip.bottom="'Save the document'" icon="download" aria-label="Save" severity="secondary" />
        <Button v-tooltip="'Top is the default'" label="Top" severity="secondary" />
        <Button v-tooltip.right="'On the right'" label="Right" severity="secondary" />
        <Button v-tooltip.bottom="'Below'" label="Bottom" severity="secondary" />
        <Button v-tooltip.left="'On the left'" label="Left" severity="secondary" />
    </DemoSection>
    <DemoSection title="Options" description="An object sets the text, placement and delays, and can disable it.">
        <Button v-tooltip="{ value: 'Shown after half a second', showDelay: 500 }" label="Show delay" severity="secondary" />
        <Button v-tooltip="{ value: 'Lingers for a second after you leave', hideDelay: 1000 }" label="Hide delay" severity="secondary" />
        <Button
            v-tooltip="{ value: 'Tooltips wrap at twenty rem so a long explanation stays readable instead of running across the whole window.', placement: 'bottom' }"
            label="Long text"
            severity="secondary"
        />
        <Button v-tooltip="{ value: 'Now you see me', disabled: !enabled }" :label="enabled ? 'Enabled' : 'Disabled'" severity="secondary" @click="enabled = !enabled" />
    </DemoSection>
    <DemoSection title="On a field" description="Focus the box with Tab: the tooltip shows, and the input is described by it.">
        <InputText v-tooltip.right="'Letters, digits and dashes'" aria-label="Username" placeholder="Username" />
    </DemoSection>
</template>
