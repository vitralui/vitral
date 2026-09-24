<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ToggleSwitch',
    category: 'Form',
    description: 'An on/off switch over a native checkbox, with a header above and on/off content beside it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import CustomContent from './ToggleSwitch/CustomContent.vue';
import HeaderAndState from './ToggleSwitch/HeaderAndState.vue';
import SwitchStates from './ToggleSwitch/SwitchStates.vue';
</script>

<template>
    <DemoSection title="Header and state" description="With `show-state-label`, the locale's On/Off is shown beside the switch."><HeaderAndState /></DemoSection>
    <DemoSection title="Custom content" description="Content shown beside the switch for each state. The second switch has no header, so it is named with aria-label."><CustomContent /></DemoSection>
    <DemoSection title="States"><SwitchStates /></DemoSection>
</template>
