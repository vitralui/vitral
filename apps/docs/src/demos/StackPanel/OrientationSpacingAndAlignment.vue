<script setup lang="ts">
import { Label, Select, StackPanel } from '@vitral/vue';
import { computed, ref } from 'vue';

const orientation = ref<'vertical' | 'horizontal'>('horizontal');
const align = ref('stretch');
const justify = ref('start');
// 'token' leaves `spacing` unset, so the panel falls back to the stackpanel.spacing token.
const spacingChoice = ref('token');
const spacing = computed(() => (spacingChoice.value === 'token' ? undefined : Number(spacingChoice.value)));

const orientations = [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' }
];
const aligns = ['stretch', 'start', 'center', 'end'].map((value) => ({ label: value, value }));
const justifies = ['start', 'center', 'end', 'space-between', 'space-evenly'].map((value) => ({ label: value, value }));
const spacings = [
    { label: 'Token (0.5rem)', value: 'token' },
    { label: '0', value: '0' },
    { label: '4px', value: '4' },
    { label: '16px', value: '16' },
    { label: '32px', value: '32' }
];
</script>

<template>
    <div class="controls">
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="sp-orientation">Orientation</Label>
            <Select id="sp-orientation" v-model="orientation" :options="orientations" option-label="label" option-value="value" size="small" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="sp-spacing">Spacing</Label>
            <Select id="sp-spacing" v-model="spacingChoice" :options="spacings" option-label="label" option-value="value" size="small" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="sp-align">Align</Label>
            <Select id="sp-align" v-model="align" :options="aligns" option-label="label" option-value="value" size="small" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="sp-justify">Justify</Label>
            <Select id="sp-justify" v-model="justify" :options="justifies" option-label="label" option-value="value" size="small" />
        </StackPanel>
    </div>
    <StackPanel class="frame tall" :orientation="orientation" :spacing="spacing" :align="align" :justify="justify">
        <div class="box c1 s1">One</div>
        <div class="box c2 s2">Two</div>
        <div class="box c3 s3">Three</div>
    </StackPanel>
</template>

<style scoped>
.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
}

.controls .demo-field {
    min-width: 10rem;
}

.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.tall {
    min-height: 11rem;
}

.box {
    --c: var(--vt-chart-1);
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--vt-border-radius-sm);
}

.c1 {
    --c: var(--vt-chart-1);
}

.c2 {
    --c: var(--vt-chart-2);
}

.c3 {
    --c: var(--vt-chart-3);
}

.s1 {
    min-width: 4rem;
    min-height: 2rem;
}

.s2 {
    min-width: 6rem;
    min-height: 3.5rem;
}

.s3 {
    min-width: 8rem;
    min-height: 5rem;
}
</style>
