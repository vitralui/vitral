<script setup lang="ts">
import { textareaStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { usePointerDrag } from '../../base/usePointerDrag';
import type { TextareaProps } from './types';
import { keepFocus } from '../../base/press';

defineOptions({ name: 'VtTextarea', inheritAttrs: false });

const props = withDefaults(defineProps<TextareaProps>(), { unstyled: undefined, variant: undefined, rows: 3 });
const model = defineModel<string | null>();

const { part, config } = useComponent(textareaStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLTextAreaElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    autoResize: props.autoResize,
    resizing: resizing.value
}));

// ---- the grip ---------------------------------------------------------------
// The library draws its own grip rather than the browser's, so it looks the
// same everywhere and follows the theme. Which way it resizes is the prop, or
// else the theme's `--vt-textarea-resize`, read once the field is on the page.

type Direction = 'vertical' | 'horizontal' | 'both' | 'none';
const themed = ref<Direction>('vertical');
const direction = computed<Direction>(() => props.resize ?? themed.value);
const showResizer = computed(() => !props.autoResize && !props.disabled && direction.value !== 'none');

let start = { width: 0, height: 0, rtl: false };
const { active: resizing, press } = usePointerDrag<null>({
    threshold: 0,
    onStart() {
        const input = inputRef.value;
        const root = rootRef.value;
        if (!input || !root) return false;
        start = { width: root.offsetWidth, height: input.offsetHeight, rtl: getComputedStyle(root).direction === 'rtl' };
    },
    onMove(_, { dx, dy }) {
        const input = inputRef.value;
        const root = rootRef.value;
        if (!input || !root) return;
        if (direction.value === 'vertical' || direction.value === 'both') {
            // Never shorter than the floor the stylesheet sets, which is one line of a single-line field.
            const floor = parseFloat(getComputedStyle(input).minHeight) || 0;
            input.style.height = `${Math.max(floor, start.height + dy)}px`;
        }
        if (direction.value === 'horizontal' || direction.value === 'both') {
            // The grip is at the end corner, which is on the left right to left.
            const width = start.width + (start.rtl ? -dx : dx);
            root.style.width = `${Math.max(Math.min(start.width, 120), width)}px`;
        }
    }
});

function onResizerPointerdown(event: PointerEvent) {
    // Resizing is not typing: the press neither focuses the text nor selects it.
    event.stopPropagation();
    event.preventDefault();
    press(event, null);
}

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
    const fromTheme = rootRef.value ? getComputedStyle(rootRef.value).getPropertyValue('--vt-textarea-resize').trim() : '';
    if (fromTheme === 'vertical' || fromTheme === 'horizontal' || fromTheme === 'both' || fromTheme === 'none') themed.value = fromTheme;
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
function onRootPointerdown(event: PointerEvent) {
    if (event.target === inputRef.value) return;
    keepFocus(event);
    inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), resize, input: inputRef });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
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
        <!-- Not a control: like the browser's grip, it is for the pointer, and the text is reachable without it. -->
        <span v-if="showResizer" aria-hidden="true" v-bind="part('resizer', { direction })" @pointerdown="onResizerPointerdown">
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"><path d="M9 3L3 9M9 6.5L6.5 9" /></svg>
        </span>
    </div>
</template>
