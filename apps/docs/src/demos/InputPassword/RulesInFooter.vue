<script setup lang="ts">
import { InputPassword, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const password = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="pw-rules">New password</Label>
        <InputPassword id="pw-rules" v-model="password" toggle-mask prompt-label="Choose a password" strong-regex="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{12,})">
            <template #footer>
                <ul style="margin: 0; padding-inline-start: 1.25rem; font-size: 0.8125rem">
                    <li>One lowercase and one uppercase letter</li>
                    <li>At least one digit</li>
                    <li>Twelve characters for a strong password</li>
                </ul>
            </template>
        </InputPassword>
    </StackPanel>
</template>
