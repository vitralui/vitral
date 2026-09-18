<script setup lang="ts">
import type { EditorCommandName } from '@vitral/core';
import { editorStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import { editorButtons, shortcutCommands } from './buttons';
import { inheritRoot, useEditorContext } from './context';
import type { EditorButtonProps } from './types';

// A toolbar button for one command. A toggle (bold, a list, a quote) is a
// toggle button whose aria-pressed follows the selection; its shortcut is in
// the tooltip and in aria-keyshortcuts.

defineOptions({ name: 'VtEditorButton' });

const props = withDefaults(defineProps<EditorButtonProps>(), { unstyled: undefined, showLabel: false });
const ctx = useEditorContext('EditorButton');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));

const spec = computed(() => editorButtons[props.command]);
const name = computed(() => props.label ?? spec.value.label(ctx.locale.value.editor));
const isLink = computed(() => props.command === 'link');

const pressed = computed(() => {
    const active = spec.value.active;
    return active ? ctx.isActive(active[0], active[1]) : undefined;
});

const disabled = computed(() => {
    if (!ctx.editable.value) return true;
    if (isLink.value) return ctx.isActive('codeBlock');
    const [command, ...args] = spec.value.command;
    return !(ctx.can as (n: string, ...a: unknown[]) => boolean)(command, ...args);
});

const shortcut = computed(() => {
    const [command, ...args] = shortcutCommands[props.command] ?? spec.value.command;
    return ctx.shortcut(command, args);
});

const tooltip = computed(() => (shortcut.value ? `${name.value} (${shortcut.value.label})` : name.value));

function onClick(event: MouseEvent) {
    if (isLink.value) {
        ctx.openLink(event.currentTarget as HTMLElement);
        return;
    }
    const [command, ...args] = spec.value.command;
    (ctx.run as (n: EditorCommandName, ...a: unknown[]) => boolean)(command as EditorCommandName, ...args);
    // A click keeps working in the text; a key press keeps focus on the toolbar.
    if (event.detail > 0) ctx.focus();
}
</script>

<template>
    <button
        v-tooltip="{ value: tooltip, showDelay: 400 }"
        type="button"
        :aria-label="showLabel ? undefined : name"
        :aria-pressed="isLink || pressed === undefined ? undefined : pressed ? 'true' : 'false'"
        :aria-haspopup="isLink ? 'dialog' : undefined"
        :aria-keyshortcuts="shortcut?.aria"
        :disabled="disabled"
        v-bind="part('button', { active: pressed, disabled })"
        @click="onClick"
    >
        <Icon :icon="icon ?? spec.icon" v-bind="part('buttonIcon')" />
        <span v-if="showLabel" v-bind="part('buttonLabel')">{{ name }}</span>
    </button>
</template>
