<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Stepper',
    category: 'Panel',
    description:
        'Steps and their panels: a StepList of Steps over StepPanels, or StepItems for a vertical layout. In a list the steps are tabs — arrows move, Enter chooses — and `linear` keeps the steps ahead out of reach until the panels move you on.'
};
</script>

<script setup lang="ts">
import { Button, InputText, Step, StepItem, StepList, StepPanel, StepPanels, Stepper } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const step = ref('1');
const vertical = ref('1');
</script>

<template>
    <DemoSection title="Linear" class="stack">
        <Stepper v-model:value="step" linear>
            <StepList aria-label="Checkout">
                <Step value="1">Cart</Step>
                <Step value="2">Shipping</Step>
                <Step value="3">Payment</Step>
            </StepList>
            <StepPanels>
                <StepPanel v-slot="{ activateCallback }" value="1">
                    <p>Three items in your cart.</p>
                    <Button label="Continue" icon="arrowRight" icon-pos="right" @click="activateCallback('2')" />
                </StepPanel>
                <StepPanel v-slot="{ activateCallback }" value="2">
                    <div class="demo-field">
                        <label for="stepper-address">Address</label>
                        <InputText id="stepper-address" />
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem">
                        <Button label="Back" severity="secondary" @click="activateCallback('1')" />
                        <Button label="Continue" icon="arrowRight" icon-pos="right" @click="activateCallback('3')" />
                    </div>
                </StepPanel>
                <StepPanel v-slot="{ activateCallback }" value="3">
                    <p>Pay and finish.</p>
                    <Button label="Back" severity="secondary" @click="activateCallback('2')" />
                </StepPanel>
            </StepPanels>
        </Stepper>
    </DemoSection>
    <DemoSection title="Vertical" class="stack">
        <Stepper v-model:value="vertical">
            <StepItem value="1">
                <Step>Create an account</Step>
                <StepPanel>Pick a name and a password.</StepPanel>
            </StepItem>
            <StepItem value="2">
                <Step>Invite your team</Step>
                <StepPanel>Send invitations by email.</StepPanel>
            </StepItem>
            <StepItem value="3">
                <Step>Start a project</Step>
                <StepPanel>Name it and choose a template.</StepPanel>
            </StepItem>
        </Stepper>
    </DemoSection>
</template>
