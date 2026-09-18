<script setup lang="ts">
import { terminalStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { TerminalEmits, TerminalProps, TerminalSlots } from './types';

// A prompt and a log. The command line is a labelled text box; what has been
// typed and answered is a WAI-ARIA log, so answers are announced as they
// arrive. Up and Down walk back and forth through earlier commands. The app
// answers each `command` through its `respond` callback.

defineOptions({ name: 'VtTerminal', inheritAttrs: false });

const props = withDefaults(defineProps<TerminalProps>(), { unstyled: undefined, prompt: '$' });
const emit = defineEmits<TerminalEmits>();
defineSlots<TerminalSlots>();
const attrs = useAttrs();
// The name belongs to the log; everything else dresses the root.
const rootAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { 'aria-label': _label, ...rest } = attrs;
    return rest;
});

const { part, locale } = useComponent(terminalStyle, props);
const id = useId();
const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

interface Entry {
    id: number;
    command: string;
    responses: string[];
}

const entries = ref<Entry[]>([]);
const text = ref('');
const history: string[] = [];
let cursor = -1;
let counter = 0;

function scrollDown() {
    nextTick(() => {
        const root = rootRef.value;
        if (root) root.scrollTop = root.scrollHeight;
    });
}

function submit() {
    const command = text.value;
    text.value = '';
    cursor = -1;
    if (command.trim()) history.unshift(command);
    const entry: Entry = { id: ++counter, command, responses: [] };
    entries.value.push(entry);
    const target = entries.value[entries.value.length - 1]!;
    scrollDown();
    if (!command.trim()) return;
    emit('command', {
        command,
        respond: (answer: string) => {
            target.responses.push(answer);
            scrollDown();
        }
    });
}

function recall(step: 1 | -1) {
    const next = cursor + step;
    if (next < -1 || next >= history.length) return;
    cursor = next;
    text.value = cursor < 0 ? '' : history[cursor]!;
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submit();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        recall(event.key === 'ArrowUp' ? 1 : -1);
    }
}

// A press anywhere that is not a selection puts the caret on the command line.
function onRootClick() {
    if (!window.getSelection()?.toString()) inputRef.value?.focus();
}

/** Prints a line into the log without a command. */
function print(line: string) {
    entries.value.push({ id: ++counter, command: '', responses: [line] });
    scrollDown();
}

function clear() {
    entries.value = [];
}

defineExpose({ print, clear, focus: () => inputRef.value?.focus() });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root'))" @click="onRootClick">
        <div v-if="welcomeMessage || $slots.welcome" v-bind="part('welcome')">
            <slot name="welcome">{{ welcomeMessage }}</slot>
        </div>
        <div role="log" aria-live="polite" :aria-label="(attrs['aria-label'] as string | undefined) ?? undefined" v-bind="part('log')">
            <div v-for="entry in entries" :key="entry.id">
                <p v-if="entry.command || !entry.responses.length" v-bind="part('entry')"><span v-bind="part('prompt')" aria-hidden="true">{{ prompt }}</span>{{ entry.command }}</p>
                <p v-for="(response, i) in entry.responses" :key="i" v-bind="part('response')">{{ response }}</p>
            </div>
        </div>
        <div v-bind="part('line')">
            <label :for="`${id}-input`" v-bind="part('prompt')"><span aria-hidden="true">{{ prompt }}</span><span class="vt-sr-only">{{ inputLabel ?? locale.aria.terminalInput }}</span></label>
            <input
                :id="`${id}-input`"
                ref="inputRef"
                v-model="text"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                v-bind="part('input')"
                @keydown="onKeydown"
            />
        </div>
    </div>
</template>
