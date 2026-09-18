<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DynamicDialog',
    category: 'Overlay',
    description:
        'A dialog opened from code, with a component as its content. Mount `<DynamicDialog />` once; `useDialog().open(Component, { props, data, onClose })` shows it as a full modal `<Dialog>`. The content injects its dialog with `useDialogRef()` (or `inject(\'dialogRef\')`) to read `data` and `close(result)`.'
};
</script>

<script setup lang="ts">
import { Button, DynamicDialog, Listbox, useDialog, useDialogRef } from '@vitral/vue';
import { defineComponent, h, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

// In an app these would be components of their own; they are inline here so the demo is one file.
const ProductPicker = defineComponent({
    setup() {
        const dialog = useDialogRef()!;
        const choice = ref<string | null>(null);
        const products = dialog.data as string[];
        return () =>
            h('div', { style: 'display: flex; flex-direction: column; gap: 0.75rem; min-width: 18rem' }, [
                h(Listbox, { modelValue: choice.value, 'onUpdate:modelValue': (v: unknown) => (choice.value = v as string), options: products, 'aria-label': 'Products' }),
                h('div', { style: 'display: flex; justify-content: flex-end; gap: 0.5rem' }, [
                    h(Button, { label: 'Cancel', severity: 'secondary', onClick: () => dialog.close() }),
                    h(Button, { label: 'Choose', disabled: !choice.value, onClick: () => dialog.close(choice.value) })
                ])
            ]);
    }
});

const dialog = useDialog();
const picked = ref('—');

function pick() {
    dialog.open(ProductPicker, {
        props: { header: 'Choose a product', style: { width: '24rem' }, dismissableMask: true },
        data: ['Keyboard', 'Mouse', 'Monitor', 'Headphones'],
        onClose: ({ type, data }) => (picked.value = type === 'config-close' && data ? String(data) : 'nothing')
    });
}
</script>

<template>
    <DemoSection title="Basic">
        <DynamicDialog />
        <Button label="Choose a product" icon="search" @click="pick" />
        <span class="demo-hint">Picked: {{ picked }}</span>
    </DemoSection>
</template>
