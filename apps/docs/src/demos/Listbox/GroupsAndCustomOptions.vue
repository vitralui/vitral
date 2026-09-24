<script setup lang="ts">
import { Label, Listbox, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const byCountry = [
    { country: 'Brasil', cities: [{ name: 'São Paulo' }, { name: 'Recife' }, { name: 'Florianópolis' }] },
    { country: 'Portugal', cities: [{ name: 'Lisboa' }, { name: 'Coimbra' }] },
    { country: 'Canada', cities: [{ name: 'Montréal' }, { name: 'Québec' }] }
];

const statuses = [
    { label: 'Online', value: 'online', tone: 'success' },
    { label: 'Away', value: 'away', tone: 'warn' },
    { label: 'Busy', value: 'busy', tone: 'danger' },
    { label: 'Offline', value: 'offline', tone: 'muted' }
];

const grouped = ref<unknown>(null);
const status = ref('online');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label id="lb-group-label">City by country</Label>
            <Listbox v-model="grouped" :options="byCountry" option-group-label="country" option-group-children="cities" option-label="name" aria-labelledby="lb-group-label" scroll-height="14rem" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label id="lb-status-label">Status</Label>
            <Listbox v-model="status" :options="statuses" option-label="label" option-value="value" aria-labelledby="lb-status-label">
                <template #option="{ option }">
                    <span :class="['demo-dot', `demo-dot-${(option as { tone: string }).tone}`]" aria-hidden="true" />
                    <span>{{ (option as { label: string }).label }}</span>
                </template>
            </Listbox>
        </StackPanel>
    </StackPanel>
</template>

<style scoped>
.demo-dot {
    width: 0.5rem;
    height: 0.5rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--vt-text-muted-color);
}

.demo-dot-success {
    background: var(--vt-success-color);
}

.demo-dot-warn {
    background: var(--vt-warn-color);
}

.demo-dot-danger {
    background: var(--vt-danger-color);
}
</style>
