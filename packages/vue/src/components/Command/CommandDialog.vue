<script setup lang="ts">
import { isClient } from '@vitral/core';
import { commandStyle } from '@vitral/styles';
import { onBeforeUnmount, onMounted } from 'vue';
import { useComponent } from '../../base/useComponent';
import Dialog from '../Dialog/Dialog.vue';
import Command from './Command.vue';
import type { CommandDialogProps, CommandEmits, CommandSlots } from './types';

// The command palette: a Command in a modal <Dialog>, named "Command palette",
// with focus in its search box. With `hotkey`, Ctrl (or ⌘) and that letter open
// it from anywhere; Escape closes it, and choosing an item closes it too.

defineOptions({ name: 'VtCommandDialog' });

const props = withDefaults(defineProps<CommandDialogProps>(), { unstyled: undefined, shouldFilter: true });
const visible = defineModel<boolean>('visible', { default: false });
const search = defineModel<string>('search', { default: '' });
const emit = defineEmits<CommandEmits>();
defineSlots<CommandSlots>();

const { part, locale } = useComponent(commandStyle, props);

function onDocumentKeydown(event: KeyboardEvent) {
    if (!props.hotkey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== props.hotkey.toLowerCase()) return;
    event.preventDefault();
    visible.value = !visible.value;
}

onMounted(() => {
    if (isClient) document.addEventListener('keydown', onDocumentKeydown);
});
onBeforeUnmount(() => {
    if (isClient) document.removeEventListener('keydown', onDocumentKeydown);
});

function onSelect(value: string) {
    emit('select', value);
    visible.value = false;
}

function onShow() {
    search.value = '';
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        :show-header="false"
        dismissable-mask
        position="top"
        :aria-label="label ?? locale.aria.commandPalette"
        :unstyled="unstyled"
        v-bind="part('dialog')"
        @show="onShow"
    >
        <Command v-model:search="search" :should-filter="shouldFilter" :filter="filter" :loop="loop" :label="label" :unstyled="unstyled" @select="onSelect">
            <slot />
        </Command>
    </Dialog>
</template>
