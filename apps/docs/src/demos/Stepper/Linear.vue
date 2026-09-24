<script setup lang="ts">
import { Button, InputText, Label, StackPanel, Step, StepList, StepPanel, StepPanels, Stepper } from '@vitral/vue';
import { ref } from 'vue';

const step = ref('1');
</script>

<template>
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
                <StackPanel spacing="0.375rem" style="min-width: 16rem">
                    <Label for="stepper-address">Address</Label>
                    <InputText id="stepper-address" />
                </StackPanel>
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
</template>
