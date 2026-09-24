<script setup lang="ts">
import { Checkbox, Fieldset } from '@vitral/vue';
import { ref } from 'vue';

const collapsed = ref(false);
const email = ref(true);
const push = ref(false);
</script>

<template>
    <div style="display: grid; gap: 0.5rem; width: 100%; max-width: 32rem">
        <Fieldset v-model:collapsed="collapsed" legend="Notifications" toggleable>
            <div style="display: grid; gap: 0.5rem">
                <Checkbox v-model="email" label="Email" binary />
                <Checkbox v-model="push" label="Push" binary />
            </div>
        </Fieldset>
        <small style="color: var(--vt-text-muted-color)">collapsed: {{ collapsed }}</small>
    </div>
</template>
