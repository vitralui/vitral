<script setup lang="ts">
import { carouselFirst, carouselPageCount, carouselStep, formatMessage, isClient } from '@vitral/core';
import { carouselStyle, transitionName } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useSwipe } from '../../base/useSwipe';
import Icon from '../Icon/Icon.vue';
import type { CarouselProps, CarouselSlots } from './types';

// The WAI-ARIA carousel: a region with the "carousel" role description, each
// item a group with the "slide" description and its position as a name, the
// items out of view hidden and inert. Rotation, when on, comes with a
// pause/play button placed first; it stops while the pointer or focus is in
// the carousel, and the slides are announced politely only while it is not
// rotating. The previous and next buttons and the slide pickers are real
// buttons; the paging is core's. A swipe (touch or mouse) pages too, with the
// track following the pointer while it drags.

defineOptions({ name: 'VtCarousel' });

const props = withDefaults(defineProps<CarouselProps>(), {
    unstyled: undefined,
    value: () => [],
    numVisible: 1,
    circular: true,
    numScroll: 1,
    orientation: 'horizontal',
    verticalViewPortHeight: '20rem',
    autoplayInterval: 0,
    showNavigators: true,
    showIndicators: true
});
const page = defineModel<number>('page', { default: 0 });
defineSlots<CarouselSlots>();

const { part, locale } = useComponent(carouselStyle, props);
const id = useId();
const trackId = `${id}-track`;

// ---- responsive layout -------------------------------------------------------------

const width = ref(isClient ? window.innerWidth : Infinity);
const onResize = () => (width.value = window.innerWidth);
if (isClient) window.addEventListener('resize', onResize);
onBeforeUnmount(() => {
    if (isClient) window.removeEventListener('resize', onResize);
});
const toPx = (length: string) => (length.endsWith('rem') || length.endsWith('em') ? parseFloat(length) * 16 : parseFloat(length));
const active = computed(() => {
    const matching = [...(props.responsiveOptions ?? [])].sort((a, b) => toPx(a.breakpoint) - toPx(b.breakpoint)).find((o) => width.value <= toPx(o.breakpoint));
    return { numVisible: matching?.numVisible ?? props.numVisible, numScroll: matching?.numScroll ?? props.numScroll };
});
const layout = computed(() => ({ count: props.value.length, numVisible: Math.max(1, active.value.numVisible), numScroll: Math.max(1, active.value.numScroll) }));
const pages = computed(() => carouselPageCount(layout.value));
const current = computed(() => Math.max(0, Math.min(page.value, pages.value - 1)));
const first = computed(() => carouselFirst(current.value, layout.value));
const vertical = computed(() => props.orientation === 'vertical');
const share = computed(() => 100 / layout.value.numVisible);
const swipe = useSwipe({
    vertical,
    disabled: () => pages.value < 2,
    onSwipe: (step) => {
        if (step < 0 ? canPrev.value : canNext.value) go(carouselStep(current.value, step, layout.value, props.circular));
    }
});
/**
 * A preset other than `'slide'` shows one item at a time and animates it where
 * it stands, so the strip stops moving and the items are stacked instead. With
 * more than one visible there is no "the item" to animate, and the strip is
 * what a carousel is for, so the preset is ignored there.
 */
const stacked = computed(() => props.transition !== undefined && props.transition !== 'slide' && props.transition !== 'none' && layout.value.numVisible === 1);
const tx = computed(() => (stacked.value ? transitionName(props.transition as never) : undefined));

const trackStyle = computed(() => {
    if (stacked.value) return undefined;
    if (vertical.value) return { transform: `translateY(calc(${-first.value * share.value}% + ${swipe.offset.value}px))` };
    // The strip runs the reading direction's way, so right to left the items
    // after the first sit to its left and the strip moves right to reach them.
    // The sign is the stylesheet's (`--_dir`), which knows the direction; the
    // pointer's offset is in screen pixels either way.
    return { transform: `translateX(calc(${-first.value * share.value}% * var(--_dir, 1) + ${swipe.offset.value}px))` };
});
const itemStyle = computed(() => (stacked.value ? undefined : vertical.value ? { height: `${share.value}%` } : { width: `${share.value}%` }));
const isVisible = (index: number) => index >= first.value && index < first.value + layout.value.numVisible;

watch(pages, (count) => {
    if (page.value >= count) page.value = Math.max(0, count - 1);
});

function go(to: number) {
    page.value = to;
}

const canPrev = computed(() => props.circular || current.value > 0);
const canNext = computed(() => props.circular || current.value < pages.value - 1);

// ---- rotation ----------------------------------------------------------------------

const playing = ref(props.autoplayInterval > 0);
const held = ref(false);
const rotating = computed(() => props.autoplayInterval > 0 && playing.value && !held.value);
let timer: ReturnType<typeof setInterval> | undefined;
watch(
    [rotating, () => props.autoplayInterval],
    ([on]) => {
        clearInterval(timer);
        if (on) timer = setInterval(() => go(carouselStep(current.value, 1, layout.value, true)), props.autoplayInterval);
    },
    { immediate: true }
);
onBeforeUnmount(() => clearInterval(timer));

function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) held.value = false;
}
</script>

<template>
    <section
        aria-roledescription="carousel"
        :aria-label="ariaLabel"
        v-bind="part('root', { orientation, stacked: stacked })"
        @pointerenter="held = true"
        @pointerleave="held = false"
        @focusin="held = true"
        @focusout="onFocusout"
    >
        <div v-if="$slots.header" v-bind="part('header')"><slot name="header" /></div>
        <div v-bind="part('content')">
            <button
                v-if="showNavigators && pages > 1"
                type="button"
                :aria-label="locale.aria.previous"
                :aria-controls="trackId"
                :disabled="!canPrev"
                v-bind="part('navigator')"
                @click="go(carouselStep(current, -1, layout, circular))"
            >
                <Icon icon="chevronLeft" />
            </button>
            <div v-bind="mergeProps(part('viewport'), swipe.handlers)" :style="vertical ? { height: verticalViewPortHeight } : undefined">
                <div :id="trackId" :aria-live="rotating ? 'off' : 'polite'" v-bind="part('track', { dragging: swipe.dragging.value, stacked: stacked })" :style="trackStyle">
                    <TransitionGroup v-if="stacked" :name="tx" tag="div" v-bind="part('stack')">
                        <div
                            v-for="(item, index) in value.filter((_, i) => isVisible(i))"
                            :key="first"
                            role="group"
                            aria-roledescription="slide"
                            :aria-label="formatMessage(locale.aria.slide, { index: first + 1, count: value.length })"
                            v-bind="part('item', { active: true })"
                        >
                            <slot name="item" :data="item" :index="first" />
                        </div>
                    </TransitionGroup>
                    <div
                        v-for="(item, index) in stacked ? [] : value"
                        :key="index"
                        role="group"
                        aria-roledescription="slide"
                        :aria-label="formatMessage(locale.aria.slide, { index: index + 1, count: value.length })"
                        :aria-hidden="isVisible(index) ? undefined : 'true'"
                        :inert="isVisible(index) ? undefined : true"
                        v-bind="part('item', { active: isVisible(index) })"
                        :style="itemStyle"
                    >
                        <slot name="item" :data="item" :index="index" />
                    </div>
                    <slot v-if="!value.length" name="empty">{{ locale.emptyMessage }}</slot>
                </div>
            </div>
            <button
                v-if="showNavigators && pages > 1"
                type="button"
                :aria-label="locale.aria.next"
                :aria-controls="trackId"
                :disabled="!canNext"
                v-bind="part('navigator')"
                @click="go(carouselStep(current, 1, layout, circular))"
            >
                <Icon icon="chevronRight" />
            </button>
        </div>
        <div v-if="(showIndicators && pages > 1) || autoplayInterval > 0" v-bind="part('footer')">
            <button
                v-if="autoplayInterval > 0"
                type="button"
                :aria-label="playing ? locale.aria.pauseSlideshow : locale.aria.playSlideshow"
                :aria-controls="trackId"
                v-bind="part('play')"
                @click="playing = !playing"
            >
                <Icon :icon="playing ? 'pause' : 'play'" />
            </button>
            <ul v-if="showIndicators && pages > 1" v-bind="part('indicators')">
                <li v-for="p in pages" :key="p">
                    <button
                        type="button"
                        :aria-label="formatMessage(locale.aria.goToSlide, { index: p })"
                        :aria-controls="trackId"
                        :aria-current="p - 1 === current ? 'true' : undefined"
                        v-bind="part('indicator', { active: p - 1 === current })"
                        @click="go(p - 1)"
                    />
                </li>
            </ul>
        </div>
        <div v-if="$slots.footer"><slot name="footer" /></div>
    </section>
</template>
