<script setup lang="ts">
import { textareaStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import type { TextareaProps } from './types';

defineOptions({ name: 'VtTextarea', inheritAttrs: false });

const props = withDefaults(defineProps<TextareaProps>(), { unstyled: undefined, variant: undefined, rows: 3 });
const model = defineModel<string | null>();

const { part, config } = useComponent(textareaStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLTextAreaElement | null>(null);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    autoResize: props.autoResize
}));

/**
 * Fits the height to the content. Collapsing to `auto` first lets the box
 * shrink as well as grow; `rows` keeps it from collapsing below its start.
 */
function resize() {
    const el = inputRef.value;
    if (!el) return;
    if (!props.autoResize) {
        el.style.height = '';
        return;
    }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
}

function onInput(event: Event) {
    model.value = (event.target as HTMLTextAreaElement).value;
    resize();
}

// A value set from outside, or a change of font or width, reflows the text.
watch([model, () => props.autoResize, () => props.rows], () => nextTick(resize));

let observer: ResizeObserver | undefined;
let lastWidth = -1;
onMounted(() => {
    resize();
    if (typeof ResizeObserver === 'undefined' || !inputRef.value) return;
    observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;
        // Only a new width rewraps the text; reacting to our own height change would loop.
        if (width === lastWidth) return;
        lastWidth = width;
        if (props.autoResize) resize();
    });
    observer.observe(inputRef.value);
});
onBeforeUnmount(() => observer?.disconnect());

// A press on the field's padding focuses the text, as it does on a native text box.
function onRootMousedown(event: MouseEvent) {
    if (event.target === inputRef.value) return;
    event.preventDefault();
    inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), resize, input: inputRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))" @mousedown="onRootMousedown">
        <textarea
            ref="inputRef"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :value="model ?? ''"
            :rows="rows"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="onInput"
        />
    </div>
</template>
