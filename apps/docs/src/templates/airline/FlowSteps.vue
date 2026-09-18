<script setup lang="ts">
import { Step, StepList, StepPanel, StepPanels, Stepper } from '@vitral/vue';
import { computed } from 'vue';
import { useTemplate } from '../kit/context';

// Where the booking is, as a stepper the traveller can step back through. The
// screen itself is the active step's panel, so each tab controls real content.
const { screen, go } = useTemplate();
const value = computed({
    get: () => screen.value,
    set: (next) => go(String(next))
});
</script>

<template>
    <Stepper v-model:value="value" class="tp-flow">
        <StepList aria-label="Booking steps">
            <Step value="results">Flights</Step>
            <Step value="seats">Seats &amp; extras</Step>
            <Step value="summary">Review &amp; pay</Step>
        </StepList>
        <StepPanels>
            <StepPanel v-for="step in ['results', 'seats', 'summary']" :key="step" :value="step" class="tp-flow-panel">
                <slot />
            </StepPanel>
        </StepPanels>
    </Stepper>
</template>
