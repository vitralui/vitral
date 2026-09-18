<script setup lang="ts">
import { formatMessage, ratingKeyValue } from '@vitral/core';
import { ratingStyle } from '@vitral/styles';
import { computed, nextTick, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { RatingEmits, RatingProps, RatingSlots } from './types';

// A WAI-ARIA radio group of stars, one tab stop: the arrows move to the next or
// previous star and choose it (wrapping), Home and End go to the ends, Space
// and Enter choose the focused star. A clearable rating is cleared by pressing
// the chosen star again, or with Delete or Backspace. Name the group with
// `aria-label` or `aria-labelledby`.

defineOptions({ name: 'VtRating' });

const props = withDefaults(defineProps<RatingProps>(), { unstyled: undefined, stars: 5, step: 1, clearable: true, onIcon: 'starFill', offIcon: 'star' });
const model = defineModel<number | null>();
const emit = defineEmits<RatingEmits>();
defineSlots<RatingSlots>();

const { part, locale } = useComponent(ratingStyle, props);

const starEls: (HTMLElement | null)[] = [];
const hovered = ref<number | null>(null);
const focusedStar = ref<number | null>(null);

// Below one, a star is a position on a scale rather than an option in a list,
// so the group becomes a slider: one value, one tab stop, announced as a
// number. At a whole star it stays the radio group it has always been.
const step = computed(() => (props.step > 0 ? Math.min(props.step, props.stars) : 1));
const fractional = computed(() => step.value < 1);
const snap = (n: number) => Math.max(0, Math.min(props.stars, Math.round(n / step.value) * step.value));

const value = computed(() => snap(model.value ?? 0));
const interactive = computed(() => !props.readonly && !props.disabled);
const tabStop = computed(() => focusedStar.value ?? (value.value > 0 ? Math.ceil(value.value) : 1));
const shown = computed(() => (interactive.value && hovered.value !== null ? hovered.value : value.value));

/** How much of star `star` is filled, 0 to 1. */
const fillOf = (star: number) => Math.max(0, Math.min(1, shown.value - (star - 1)));

const valueText = computed(() => {
    const n = value.value;
    return n === 1 ? locale.value.aria.star : formatMessage(locale.value.aria.stars, { star: Number(n.toFixed(2)) });
});

const nameOf = (star: number) => (star === 1 ? locale.value.aria.star : formatMessage(locale.value.aria.stars, { star }));

function set(next: number, event: Event) {
    const result = next > 0 ? next : null;
    if (result === (model.value ?? null)) return;
    model.value = result;
    emit('change', { originalEvent: event, value: result });
}

function focusStar(star: number) {
    focusedStar.value = star;
    nextTick(() => starEls[star - 1]?.focus());
}

/** The value a press at this point of a star means: its left half is x.5. */
function valueAt(star: number, event: MouseEvent): number {
    if (!fractional.value) return star;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const across = getComputedStyle(event.currentTarget as Element).direction === 'rtl' ? (box.right - event.clientX) / box.width : (event.clientX - box.left) / box.width;
    // Snapped up: pressing anywhere in the first half of a star means half of it.
    return Math.max(step.value, Math.min(star, star - 1 + Math.ceil(Math.max(0, Math.min(1, across)) / step.value) * step.value));
}

function onClick(star: number, event: MouseEvent) {
    if (!interactive.value) return;
    focusedStar.value = star;
    const next = valueAt(star, event);
    set(props.clearable && next === value.value ? 0 : next, event);
}

function onMove(star: number, event: MouseEvent) {
    if (!interactive.value) return;
    hovered.value = fractional.value ? valueAt(star, event) : star;
}

function onKeydown(star: number, event: KeyboardEvent) {
    if (props.disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (interactive.value) set(star, event);
        return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && props.clearable) {
        event.preventDefault();
        if (interactive.value) set(0, event);
        return;
    }
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    // The arrows move from the focused star, which is the chosen one unless read-only focus wandered.
    const from = interactive.value ? value.value || star : star;
    const next = ratingKeyValue(event.key, from, props.stars, { rtl, step: step.value, allowZero: props.clearable && fractional.value });
    if (next === null) return;
    event.preventDefault();
    focusStar(next);
    if (interactive.value) set(next, event);
}

function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) focusedStar.value = null;
    emit('blur', event);
}
</script>

<template>
    <div
        :role="fractional ? 'slider' : 'radiogroup'"
        :tabindex="fractional ? (disabled ? -1 : 0) : undefined"
        :aria-valuemin="fractional ? 0 : undefined"
        :aria-valuemax="fractional ? stars : undefined"
        :aria-valuenow="fractional ? value : undefined"
        :aria-valuetext="fractional ? valueText : undefined"
        :aria-readonly="readonly ? 'true' : undefined"
        :aria-disabled="disabled ? 'true' : undefined"
        :aria-invalid="invalid ? 'true' : undefined"
        v-bind="part('root', { readonly, disabled, invalid })"
        @mouseleave="hovered = null"
        @focusin="emit('focus', $event)"
        @focusout="onFocusout"
        @keydown="fractional ? onKeydown(Math.ceil(value) || 1, $event) : undefined"
    >
        <span
            v-for="star in stars"
            :key="star"
            :ref="(el) => (starEls[star - 1] = el as HTMLElement | null)"
            :role="fractional ? 'presentation' : 'radio'"
            :aria-checked="fractional ? undefined : star === value ? 'true' : 'false'"
            :aria-label="fractional ? undefined : nameOf(star)"
            :tabindex="fractional || disabled ? -1 : star === tabStop ? 0 : -1"
            v-bind="part('option', { active: fillOf(star) > 0, hover: hovered !== null && star - 1 < hovered, focused: focusedStar === star })"
            @click="onClick(star, $event)"
            @keydown="fractional ? undefined : onKeydown(star, $event)"
            @focus="focusedStar = star"
            @mouseenter="onMove(star, $event)"
            @mousemove="fractional ? onMove(star, $event) : undefined"
        >
            <!--
                The empty star is always drawn; the filled one is laid over it and
                clipped to the fraction. At a whole star the fraction is 0 or 1,
                so this is the same two states it always had.
            -->
            <slot name="officon" :value="star">
                <Icon :icon="offIcon" v-bind="part('offIcon')" />
            </slot>
            <span v-if="fillOf(star) > 0" v-bind="part('fill')" :style="{ width: `${fillOf(star) * 100}%` }">
                <slot name="onicon" :value="star">
                    <Icon :icon="onIcon" v-bind="part('onIcon')" />
                </slot>
            </span>
        </span>
    </div>
</template>
