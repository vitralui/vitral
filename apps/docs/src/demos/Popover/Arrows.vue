<script setup lang="ts">
import { Button, HoverCard, Popover, TieredMenu, Tooltip as vTooltip, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

// Off by default. Each anchored popup turns it on with `arrow`, or the whole
// app does: app.use(Vitral, { overlayArrow: true }). The arrow follows the
// side the popup ends up on, so a popup that flips for room points the right way.
const note = ref<InstanceType<typeof Popover> | null>(null);
const menu = ref<InstanceType<typeof TieredMenu> | null>(null);
const items: MenuItem[] = [
    { label: 'New', icon: 'plus', items: [{ label: 'Document' }, { label: 'Spreadsheet' }] },
    { label: 'Share', icon: 'user' },
    { separator: true },
    { label: 'Delete', icon: 'trash' }
];
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center">
        <Button label="Popover" severity="secondary" aria-haspopup="dialog" @click="note?.toggle($event)" />
        <Popover ref="note" arrow placement="bottom" aria-label="A note">
            <p style="margin: 0; max-width: 14rem">The arrow points at the button that opened it.</p>
        </Popover>

        <Button label="Menu" icon="menu" severity="secondary" aria-haspopup="menu" @click="menu?.toggle($event)" />
        <TieredMenu ref="menu" :model="items" popup arrow />

        <HoverCard arrow placement="top">
            <template #trigger><a href="#" @click.prevent>@ana</a></template>
            <strong>Ana Souza</strong>
            <p style="margin: 0.25rem 0 0">Product designer</p>
        </HoverCard>

        <Button v-tooltip.right="{ value: 'Saves the draft', arrow: true }" label="Tooltip" severity="secondary" />
    </div>
</template>
