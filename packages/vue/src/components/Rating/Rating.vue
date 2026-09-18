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

const props = withDefaults(defineProps<RatingProps>(), { unstyled: undefined, stars: 5, clearable: true, onIcon: 'starFill', offIcon: 'star' });
const model = defineModel<number | null>();
const emit = defineEmits<RatingEmits>();
defineSlots<RatingSlots>();

const { part, locale } = useComponent(ratingStyle, props);

const starEls: (HTMLElement | null)[] = [];
const hovered = ref<number | null>(null);
const focusedStar = ref<number | null>(null);

const value = computed(() => Math.max(0, Math.min(props.stars, Math.round(model.value ?? 0))));
const interactive = computed(() => !props.readonly && !props.disabled);
const tabStop = computed(() => focusedStar.value ?? (value.value > 0 ? value.value : 1));
const shown = computed(() => (interactive.value && hovered.value !== null ? hovered.value : value.value));

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

function onClick(star: number, event: MouseEvent) {
    if (!interactive.value) return;
    focusedStar.value = star;
    set(props.clearable && star === value.value ? 0 : star, event);
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
    const next = ratingKeyValue(event.key, from, props.stars, { rtl });
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
        role="radiogroup"
        :aria-readonly="readonly ? 'true' : undefined"
        :aria-disabled="disabled ? 'true' : undefined"
        :aria-invalid="invalid ? 'true' : undefined"
        v-bind="part('root', { readonly, disabled, invalid })"
        @mouseleave="hovered = null"
        @focusin="emit('focus', $event)"
        @focusout="onFocusout"
    >
        <span
            v-for="star in stars"
            :key="star"
            :ref="(el) => (starEls[star - 1] = el as HTMLElement | null)"
            role="radio"
            :aria-checked="star === value ? 'true' : 'false'"
            :aria-label="nameOf(star)"
            :tabindex="disabled ? -1 : star === tabStop ? 0 : -1"
            v-bind="part('option', { active: star <= shown, hover: hovered !== null && star <= hovered, focused: focusedStar === star })"
            @click="onClick(star, $event)"
            @keydown="onKeydown(star, $event)"
            @focus="focusedStar = star"
            @mouseenter="hovered = star"
        >
            <slot v-if="star <= shown" name="onicon" :value="star">
                <Icon :icon="onIcon" v-bind="part('onIcon')" />
            </slot>
            <slot v-else name="officon" :value="star">
                <Icon :icon="offIcon" v-bind="part('offIcon')" />
            </slot>
        </span>
    </div>
</template>
