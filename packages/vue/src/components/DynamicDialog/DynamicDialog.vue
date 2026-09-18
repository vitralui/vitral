<script setup lang="ts">
import { dynamicdialogStyle } from '@vitral/styles';
import { onBeforeUnmount, shallowReactive } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { DynamicDialogCloseResult, DynamicDialogInstance } from '../../config/services';
import Dialog from '../Dialog/Dialog.vue';
import DialogProvider from './DialogProvider';
import type { DynamicDialogProps } from './types';

// The place dialogs opened with useDialog() are rendered: mount it once, near
// the root. Each is a full <Dialog> — the WAI-ARIA modal dialog with its focus
// handling — with the given component as content. The content injects its
// instance (useDialogRef(), or 'dialogRef') to read `data` and close itself;
// Escape, the close button or the mask close it too. `onClose` runs as it
// closes; the entry is dropped once the closing animation has finished.

defineOptions({ name: 'VtDynamicDialog' });

const props = withDefaults(defineProps<DynamicDialogProps>(), { unstyled: undefined });
const { part, context } = useComponent(dynamicdialogStyle, props);

interface Entry {
    instance: DynamicDialogInstance;
    visible: boolean;
    result: DynamicDialogCloseResult;
}

const entries = shallowReactive<Entry[]>([]);
const find = (instance: DynamicDialogInstance) => entries.find((entry) => entry.instance === instance);

function setVisible(entry: Entry, visible: boolean) {
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1, { ...entry, visible });
}

const offs = [
    context.dialog.on('open', (instance) => {
        entries.push({ instance, visible: true, result: { type: 'dialog-close' } });
    }),
    context.dialog.on('close', ({ instance, data }) => {
        const entry = find(instance);
        if (!entry || !entry.visible) return;
        entry.result = { type: 'config-close', data };
        setVisible(entry, false);
    })
];
onBeforeUnmount(() => offs.forEach((off) => off()));

function onVisible(entry: Entry, visible: boolean) {
    if (!visible) setVisible(entry, false);
}

function onHide(entry: Entry) {
    const current = find(entry.instance);
    current?.instance.options.onClose?.(current.result);
}

function afterHide(entry: Entry) {
    const index = entries.findIndex((e) => e.instance === entry.instance);
    if (index >= 0) entries.splice(index, 1);
}

function listeners(entry: Entry) {
    const out: Record<string, unknown> = {};
    for (const [name, fn] of Object.entries(entry.instance.options.emits ?? {})) out[`on${name[0]!.toUpperCase()}${name.slice(1)}`] = fn;
    return out;
}
</script>

<template>
    <template v-for="entry in entries" :key="entry.instance.id">
        <Dialog
            v-bind="{ unstyled, ...defaults, ...entry.instance.options.props }"
            :visible="entry.visible"
            @update:visible="onVisible(entry, $event)"
            @hide="onHide(entry)"
            @after-hide="afterHide(entry)"
        >
            <template v-if="entry.instance.options.templates?.header" #header>
                <DialogProvider :instance="entry.instance">
                    <div v-bind="part('header')"><component :is="entry.instance.options.templates.header" /></div>
                </DialogProvider>
            </template>
            <DialogProvider :instance="entry.instance">
                <component :is="entry.instance.content" v-bind="listeners(entry)" />
            </DialogProvider>
            <template v-if="entry.instance.options.templates?.footer" #footer>
                <DialogProvider :instance="entry.instance">
                    <div v-bind="part('footer')"><component :is="entry.instance.options.templates.footer" /></div>
                </DialogProvider>
            </template>
        </Dialog>
    </template>
</template>
