<script setup lang="ts">
import { Step, StepItem, StepPanel, Stepper } from '@vitral/vue';
import { ref } from 'vue';

const vertical = ref('1');
</script>

<template>
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
</template>
