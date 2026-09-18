<script setup lang="ts">
import { activeEditorMark, editorColorVar } from '@vitral/core';
import { highlighter, textColor } from '@vitral/icons';
import { editorStyle } from '@vitral/styles';
import { computed, nextTick, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import Popover from '../Popover/Popover.vue';
import { inheritRoot, useEditorContext } from './context';
import type { EditorColorPickerProps } from './types';

// A text colour or highlight from the theme's palette: a button showing the
// current colour, opening a grid of swatches (toggle buttons named by colour,
// moved through with the arrow keys) and a "none" swatch.

defineOptions({ name: 'VtEditorColorPicker' });

const COLUMNS = 5;

const props = withDefaults(defineProps<EditorColorPickerProps>(), { unstyled: undefined, kind: 'color' });
const ctx = useEditorContext('EditorColorPicker');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const text = computed(() => ctx.locale.value.editor);
const name = computed(() => props.label ?? (props.kind === 'color' ? text.value.textColor : text.value.highlight));
const noneLabel = computed(() => (props.kind === 'color' ? text.value.defaultColor : text.value.noHighlight));

const popover = ref<InstanceType<typeof Popover> | null>(null);
const grid = ref<HTMLElement | null>(null);
const open = ref(false);

const current = computed(() => {
    void ctx.state.value;
    return activeEditorMark(ctx.editor.state, props.kind)?.attrs?.color ?? null;
});

const disabled = computed(() => !ctx.can(props.kind === 'color' ? 'setColor' : 'setHighlight', 'red') && !ctx.can(props.kind === 'color' ? 'setColor' : 'setHighlight', null));

const cssOf = (color: string) => {
    const entry = ctx.colors.value.find((c) => c.name === color) ?? ctx.editor.palette.find((c) => c.name === color);
    const fallback = props.kind === 'color' ? entry?.text : entry?.highlight;
    return `var(${editorColorVar(color, props.kind)}${fallback ? `, ${fallback}` : ''})`;
};

const barStyle = computed(() => (current.value ? { background: cssOf(current.value) } : props.kind === 'highlight' ? { background: 'transparent' } : undefined));

function swatchStyle(color: string) {
    return props.kind === 'color' ? { color: cssOf(color) } : { background: cssOf(color) };
}

function colorName(color: string) {
    return text.value.colors[color] ?? color;
}

function toggle(event: MouseEvent) {
    popover.value?.toggle(event);
}

function onShow() {
    open.value = true;
    nextTick(() => grid.value?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus());
}

function pick(color: string | null) {
    ctx.run(props.kind === 'color' ? 'setColor' : 'setHighlight', color);
    // Back where the picker was opened from: the text after a click, the button after the keyboard.
    popover.value?.hide();
}

function onGridKeydown(event: KeyboardEvent) {
    const buttons = Array.from(grid.value?.querySelectorAll<HTMLElement>('button') ?? []);
    const index = buttons.indexOf(event.target as HTMLElement);
    if (index < 0) return;
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS };
    let next: number | null = null;
    if (event.key in step) next = index + step[event.key]!;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    if (next === null) return;
    event.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, next))]?.focus();
}
</script>

<template>
    <button
        v-tooltip="{ value: name, showDelay: 400 }"
        type="button"
        :aria-label="name"
        aria-haspopup="dialog"
        :aria-expanded="open ? 'true' : 'false'"
        :disabled="disabled"
        v-bind="part('button', { active: !!current, disabled })"
        @click="toggle"
    >
        <Icon :icon="icon ?? (kind === 'color' ? textColor : highlighter)" v-bind="part('buttonIcon')" />
        <span aria-hidden="true" v-bind="part('colorBar')" :style="barStyle" />
    </button>
    <Popover ref="popover" :aria-label="name" @show="onShow(); ctx.popups.value++" @hide="open = false; ctx.popups.value--">
        <div v-bind="part('panel')" style="width: auto">
            <div ref="grid" role="group" :aria-label="name" v-bind="part('swatches')" @keydown="onGridKeydown">
                <button type="button" :aria-label="noneLabel" :aria-pressed="current ? 'false' : 'true'" :title="noneLabel" v-bind="part('swatch', { none: true, selected: !current, kind })" @click="pick(null)" />
                <button
                    v-for="color in ctx.colors.value"
                    :key="color.name"
                    type="button"
                    :aria-label="colorName(color.name)"
                    :aria-pressed="current === color.name ? 'true' : 'false'"
                    :title="colorName(color.name)"
                    :style="swatchStyle(color.name)"
                    v-bind="part('swatch', { selected: current === color.name, kind })"
                    @click="pick(color.name)"
                >
                    <span v-if="kind === 'color'" aria-hidden="true">A</span>
                </button>
            </div>
        </div>
    </Popover>
</template>
