<script setup lang="ts">
import { formatMessage, rovingMove } from '@vitral/core';
import { galleriaStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useSwipe } from '../../base/useSwipe';
import { useModal } from '../../composables/useModal';
import Icon from '../Icon/Icon.vue';
import type { GalleriaProps, GalleriaSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A gallery in the manner of the WAI-ARIA carousel: the shown item is a slide
// group named by its position, announced politely unless rotating; the
// thumbnails are one tab stop whose arrows move and show (and say which is
// current); rotation has a pause button and holds while the pointer or focus
// is inside. Full screen, the gallery is a modal dialog with a close button.
// A horizontal swipe on the shown item moves to its neighbour.

defineOptions({ name: 'VtGalleria' });

const props = withDefaults(defineProps<GalleriaProps>(), {
    unstyled: undefined,
    value: () => [],
    numVisible: 3,
    showThumbnails: true,
    thumbnailsPosition: 'bottom',
    showThumbnailNavigators: true,
    transitionInterval: 4000
});
const overlayTarget = useOverlayTarget();
const activeIndex = defineModel<number>('activeIndex', { default: 0 });
const visible = defineModel<boolean>('visible', { default: false });
defineSlots<GalleriaSlots>();

const { part, locale } = useComponent(galleriaStyle, props);
const id = useId();
const stageId = `${id}-stage`;
const maskRef = ref<HTMLElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);
const thumbEls: (HTMLElement | null)[] = [];

const count = computed(() => props.value.length);
const current = computed(() => Math.max(0, Math.min(activeIndex.value, count.value - 1)));
const shown = computed(() => !props.fullScreen || visible.value);
const vertical = computed(() => props.thumbnailsPosition === 'left' || props.thumbnailsPosition === 'right');

const windowSize = computed(() => Math.min(props.numVisible, count.value));
const windowFirst = computed(() => Math.max(0, Math.min(current.value - Math.floor(windowSize.value / 2), count.value - windowSize.value)));
const windowItems = computed(() => props.value.slice(windowFirst.value, windowFirst.value + windowSize.value).map((item, i) => ({ item, index: windowFirst.value + i })));

function go(index: number) {
    if (count.value === 0) return;
    if (props.circular) activeIndex.value = (index + count.value) % count.value;
    else activeIndex.value = Math.max(0, Math.min(index, count.value - 1));
}

const canPrev = computed(() => props.circular || current.value > 0);
const canNext = computed(() => props.circular || current.value < count.value - 1);

const swipe = useSwipe({
    disabled: () => count.value < 2,
    onSwipe: (step) => {
        if (step < 0 ? canPrev.value : canNext.value) go(current.value + step);
    }
});

function onThumbKeydown(event: KeyboardEvent) {
    const move = rovingMove(event.key, { orientation: vertical.value ? 'vertical' : 'horizontal' });
    if (!move) return;
    event.preventDefault();
    const to = move === 'first' ? 0 : move === 'last' ? count.value - 1 : current.value + (move === 'next' ? 1 : -1);
    go(to);
    nextTick(() => thumbEls[current.value - windowFirst.value]?.focus());
}

// ---- rotation ----------------------------------------------------------------------

const playing = ref(!!props.autoPlay);
const held = ref(false);
const rotating = computed(() => !!props.autoPlay && playing.value && !held.value && shown.value);
let timer: ReturnType<typeof setInterval> | undefined;
watch(
    rotating,
    (on) => {
        clearInterval(timer);
        if (on) timer = setInterval(() => (activeIndex.value = (current.value + 1) % Math.max(1, count.value)), props.transitionInterval);
    },
    { immediate: true }
);
onBeforeUnmount(() => clearInterval(timer));

function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) held.value = false;
}

// ---- full screen -------------------------------------------------------------------

const { onMaskPointerdown, onMaskClick } = useModal({
    panel: computed(() => (props.fullScreen ? dialogRef.value : null)),
    mask: computed(() => (props.fullScreen ? maskRef.value : null)),
    dismissableMask: true,
    onClose: () => (visible.value = false)
});

function onMaskEvent<E extends MouseEvent | PointerEvent>(handler: (event: E) => void, event: E) {
    if (props.fullScreen) handler(event);
}

defineExpose({ go });
</script>

<template>
    <Teleport :to="overlayTarget" :disabled="!fullScreen">
        <Transition name="vt-fade">
            <div
                v-if="shown"
                ref="maskRef"
                v-bind="fullScreen ? part('mask') : {}"
                @pointerdown="onMaskEvent(onMaskPointerdown, $event)"
                @click="onMaskEvent(onMaskClick, $event)"
            >
                <div
                    ref="dialogRef"
                    :role="fullScreen ? 'dialog' : undefined"
                    :aria-modal="fullScreen ? 'true' : undefined"
                    :aria-label="fullScreen ? ariaLabel || locale.aria.fullScreen : undefined"
                    v-bind="fullScreen ? part('fullscreen') : {}"
                >
                    <button v-if="fullScreen" type="button" :aria-label="locale.aria.close" v-bind="part('close')" @click="visible = false">
                        <Icon icon="x" />
                    </button>
                    <section
                        aria-roledescription="carousel"
                        :aria-label="ariaLabel"
                        v-bind="part('root', { position: thumbnailsPosition })"
                        @pointerenter="held = true"
                        @pointerleave="held = false"
                        @focusin="held = true"
                        @focusout="onFocusout"
                    >
                        <div v-if="$slots.header" v-bind="part('header')"><slot name="header" /></div>
                        <div :id="stageId" v-bind="part('stage')" :aria-live="rotating ? 'off' : 'polite'">
                            <button
                                v-if="autoPlay"
                                type="button"
                                :aria-label="playing ? locale.aria.pauseSlideshow : locale.aria.playSlideshow"
                                :aria-controls="stageId"
                                v-bind="part('play')"
                                @click="playing = !playing"
                            >
                                <Icon :icon="playing ? 'pause' : 'play'" />
                            </button>
                            <div
                                v-if="count"
                                :key="current"
                                role="group"
                                aria-roledescription="slide"
                                :aria-label="formatMessage(locale.aria.slide, { index: current + 1, count })"
                                v-bind="mergeProps(part('item', { dragging: swipe.dragging.value }), swipe.handlers)"
                                :style="swipe.dragging.value ? { transform: `translateX(${swipe.offset.value}px)` } : undefined"
                            >
                                <slot name="item" :item="value[current]" :index="current" />
                                <div v-if="$slots.caption" v-bind="part('caption')">
                                    <slot name="caption" :item="value[current]" :index="current" />
                                </div>
                            </div>
                            <template v-if="showItemNavigators && count > 1">
                                <button type="button" :aria-label="locale.aria.previous" :disabled="!canPrev" v-bind="part('navigator', { side: 'prev' })" @click="go(current - 1)">
                                    <Icon icon="chevronLeft" />
                                </button>
                                <button type="button" :aria-label="locale.aria.next" :disabled="!canNext" v-bind="part('navigator', { side: 'next' })" @click="go(current + 1)">
                                    <Icon icon="chevronRight" />
                                </button>
                            </template>
                        </div>
                        <ul v-if="showIndicators && count > 1" v-bind="part('indicators')">
                            <li v-for="(_, i) in value" :key="i">
                                <button
                                    type="button"
                                    :aria-label="formatMessage(locale.aria.goToSlide, { index: i + 1 })"
                                    :aria-controls="stageId"
                                    :aria-current="i === current ? 'true' : undefined"
                                    v-bind="part('indicator', { active: i === current })"
                                    @click="go(i)"
                                >
                                    <slot name="indicator" :index="i" :active="i === current" />
                                </button>
                            </li>
                        </ul>
                        <div v-if="showThumbnails && count > 1" v-bind="part('thumbnails')">
                            <button v-if="showThumbnailNavigators" type="button" :aria-label="locale.aria.previous" :disabled="!canPrev" v-bind="part('thumbnailNavigator')" @click="go(current - 1)">
                                <Icon icon="chevronLeft" />
                            </button>
                            <ul :aria-label="locale.aria.thumbnails" v-bind="part('thumbnailList')" @keydown="onThumbKeydown">
                                <li v-for="(entry, i) in windowItems" :key="entry.index">
                                    <button
                                        :ref="(el: unknown) => (thumbEls[i] = el as HTMLElement | null)"
                                        type="button"
                                        :tabindex="entry.index === current ? 0 : -1"
                                        :aria-label="formatMessage(locale.aria.goToSlide, { index: entry.index + 1 })"
                                        :aria-controls="stageId"
                                        :aria-current="entry.index === current ? 'true' : undefined"
                                        v-bind="part('thumbnail', { active: entry.index === current })"
                                        @click="go(entry.index)"
                                    >
                                        <slot name="thumbnail" :item="entry.item" :index="entry.index" />
                                    </button>
                                </li>
                            </ul>
                            <button v-if="showThumbnailNavigators" type="button" :aria-label="locale.aria.next" :disabled="!canNext" v-bind="part('thumbnailNavigator')" @click="go(current + 1)">
                                <Icon icon="chevronRight" />
                            </button>
                        </div>
                        <div v-if="$slots.footer" v-bind="part('footer')"><slot name="footer" /></div>
                    </section>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
