<script setup lang="ts">
import { commandStyle } from '@vitral/styles';
import { computed, inject, mergeProps, useAttrs } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import { CommandKey, inheritUnstyled } from './context';
import type { CommandInputProps } from './types';

defineOptions({ name: 'VtCommandInput', inheritAttrs: false });

const props = withDefaults(defineProps<CommandInputProps>(), { unstyled: undefined });
const command = inject(CommandKey, null);
const attrs = useAttrs();
const { part, locale } = useComponent(commandStyle, inheritUnstyled(props, command));

const activeDescendant = computed(() => command?.activeId.value ?? undefined);

function onInput(event: Event) {
    if (command) command.search.value = (event.target as HTMLInputElement).value;
}
</script>

<template>
    <div v-bind="part('inputWrapper')">
        <Icon icon="search" />
        <input
            :id="command?.inputId"
            v-bind="mergeProps(attrs, part('input'))"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            :aria-controls="command?.listId"
            :aria-activedescendant="activeDescendant"
            :aria-label="(attrs['aria-label'] as string | undefined) ?? locale.aria.commandInput"
            :placeholder="placeholder"
            :value="command?.search.value"
            @input="onInput"
            @keydown="command?.onKeydown($event)"
        />
    </div>
</template>
