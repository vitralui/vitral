<script setup lang="ts">
import { commandStyle } from '@vitral/styles';
import { computed, inject, onBeforeUnmount, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { CommandGroupKey, CommandKey, inheritUnstyled, type CommandItemEntry } from './context';
import type { CommandItemEmits, CommandItemProps, CommandSlots } from './types';

defineOptions({ name: 'VtCommandItem' });

const props = withDefaults(defineProps<CommandItemProps>(), { unstyled: undefined, keywords: () => [] });
const emit = defineEmits<CommandItemEmits>();
defineSlots<CommandSlots>();

const command = inject(CommandKey, null);
const group = inject(CommandGroupKey, null);
const { part } = useComponent(commandStyle, inheritUnstyled(props, command));

const id = useId();
const el = ref<HTMLElement | null>(null);
const valueOf = () => props.value ?? el.value?.textContent?.trim() ?? '';
const entry: CommandItemEntry = {
    id: `${id}-item`,
    value: valueOf,
    keywords: () => props.keywords,
    disabled: () => !!props.disabled,
    forceMount: () => !!props.forceMount,
    groupId: group?.id ?? null,
    el,
    onSelect: () => emit('select', valueOf())
};
if (command) onBeforeUnmount(command.register(entry));

const shown = computed(() => !command || command.visible(entry));
const active = computed(() => command?.activeId.value === entry.id);

function onClick() {
    if (command) command.select(entry);
    else if (!props.disabled) entry.onSelect();
}

function onPointermove() {
    if (command && !props.disabled && !active.value) command.activeId.value = entry.id;
}
</script>

<template>
    <div
        v-show="shown"
        :id="entry.id"
        ref="el"
        role="option"
        :aria-selected="active ? 'true' : 'false'"
        :aria-disabled="disabled ? 'true' : undefined"
        v-bind="part('item', { focused: active, disabled })"
        @click="onClick"
        @pointermove="onPointermove"
        @mousedown.prevent
    >
        <slot />
        <kbd v-if="shortcut" v-bind="part('shortcut')">{{ shortcut }}</kbd>
    </div>
</template>
