<script setup lang="ts">
import { getIcon, ICON_STROKE_WIDTH, ICON_VIEWBOX, isMirrored, type IconDef } from '@vitral/icons';
import { computed, toRaw, type Component } from 'vue';
import type { IconProps } from './types';

// One element for every kind of icon a component is handed: our own icon data
// (drawn here as an SVG), another library's Vue component (rendered with the
// same class, size and accessibility), trusted SVG markup, or icon-font
// classes. Every `icon` prop in the library comes through here, so each of
// those works anywhere an icon is accepted.

defineOptions({ name: 'VtIcon' });

// `mirrored` has three answers, not two: told to, told not to, and not told,
// which is the usual one and leaves it to the icon. Vue would otherwise cast an
// absent boolean prop to `false` and every icon would stop turning round.
const props = withDefaults(defineProps<IconProps>(), { mirrored: undefined });

const isDef = (value: unknown): value is IconDef => typeof value === 'object' && value !== null && typeof (value as IconDef).body === 'string';
const isMarkup = (value: string) => /^\s*<svg[\s>]/i.test(value);

const resolved = computed<
    { kind: 'def'; def: IconDef } | { kind: 'component'; component: Component } | { kind: 'markup'; html: string } | { kind: 'class'; name: string }
>(() => {
    const icon = props.icon;
    if (typeof icon === 'string') {
        const def = getIcon(icon);
        if (def) return { kind: 'def', def };
        return isMarkup(icon) ? { kind: 'markup', html: icon } : { kind: 'class', name: icon };
    }
    if (isDef(icon)) return { kind: 'def', def: icon };
    // A component kept in reactive state arrives as a proxy; render the original.
    return { kind: 'component', component: toRaw(icon) as Component };
});

const dimension = computed(() => (props.size === undefined ? undefined : typeof props.size === 'number' ? `${props.size}px` : props.size));

// Size and stroke come from the theme (`--vt-icon-size`, `--vt-icon-stroke-width`
// in the base styles); the props only override them for one instance.
const style = computed(() => {
    const out: Record<string, string> = {};
    if (dimension.value) Object.assign(out, { width: dimension.value, height: dimension.value, fontSize: dimension.value });
    if (props.strokeWidth !== undefined && props.strokeWidth !== '') out.strokeWidth = String(props.strokeWidth);
    return Object.keys(out).length ? out : undefined;
});

const a11y = computed(() => (props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': 'true' as const }));

// Which way round the icon goes is left to CSS, keyed off the `dir` the page
// already carries: nothing here reads the layout, so it is the same on the
// server and it follows a `dir` changed at runtime without re-rendering.
// An icon that is not ours cannot be asked, so it mirrors only if told to.
const mirrored = computed(() => props.mirrored ?? (resolved.value.kind === 'def' && isMirrored(resolved.value.def)));
const classes = computed(() => ['vt-icon', { 'vt-icon-spin': props.spin, 'vt-icon-mirrored': mirrored.value }]);
</script>

<template>
    <svg
        v-if="resolved.kind === 'def'"
        :class="classes"
        :viewBox="resolved.def.viewBox ?? ICON_VIEWBOX"
        :style="style"
        fill="none"
        stroke="currentColor"
        :stroke-width="ICON_STROKE_WIDTH"
        stroke-linecap="round"
        stroke-linejoin="round"
        focusable="false"
        v-bind="a11y"
        v-html="resolved.def.body"
    />
    <component :is="resolved.component" v-else-if="resolved.kind === 'component'" :class="[classes, 'vt-icon-external']" :style="style" focusable="false" v-bind="a11y" />
    <span v-else-if="resolved.kind === 'markup'" :class="[classes, 'vt-icon-markup']" :style="style" v-bind="a11y" v-html="resolved.html" />
    <span v-else :class="[classes, resolved.name]" :style="style" v-bind="a11y" />
</template>
