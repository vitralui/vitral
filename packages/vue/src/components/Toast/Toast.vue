<script setup lang="ts">
import { arrangeToasts, createTimer, formatMessage, liveRegion, severityIcon, toastToReplace, ZIndex, type Timer } from '@vitral/core';
import { toastStyle } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ToastAction, ToastMessage } from '../../config/services';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import type { ToastEmits, ToastProps, ToastSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// Renders what useToast() sends. Each card's text sits in a live region (a
// polite `status`, or an `alert` for `danger`) with the buttons outside it, so
// the announcement is the message and not "Close". A card with a `life`
// counts down only while nobody is pointing at it or working in it (WCAG 2.2.1),
// and, unless told otherwise, while the page is in view.
//
// Which cards show is core's arrangeToasts: pinned ones first and always, the
// rest up to `max`, the newer ones waiting. A waiting card's countdown starts
// when it comes into view, not when it was sent.

defineOptions({ name: 'VtToast' });

const props = withDefaults(defineProps<ToastProps>(), {
    unstyled: undefined,
    position: 'top-right',
    overflow: 'queue',
    pauseOnPageHidden: true,
    swipeToClose: true
});
const overlayTarget = useOverlayTarget();
const emit = defineEmits<ToastEmits>();
defineSlots<ToastSlots>();

const { part, context, config, locale } = useComponent(toastStyle, props);

interface Entry {
    key: string | number;
    message: ToastMessage;
    pinned: boolean;
    timer?: Timer;
    /** How many messages this card stands for, through `collapseKey`. */
    count: number;
    /** Raised whenever the life starts again, so the progress bar starts again with it. */
    round: number;
}

const entries = shallowRef<Entry[]>([]);
const rootRef = ref<HTMLElement | null>(null);
/** The pile is spread: pointed at, or holding focus. */
const expanded = ref(false);
/** The stack has taken a z-index of its own. */
let layered = false;
let counter = 0;

const layout = computed(() => arrangeToasts(entries.value, { max: props.max, newestFirst: props.newestOnTop || props.stacked }));
const shown = computed(() => layout.value.shown);

const timed = (message: ToastMessage) => !message.pinned && !!message.life && message.life > 0;

function makeEntry(message: ToastMessage, key: string | number, count = 1, round = 0): Entry {
    const entry: Entry = { key, message, pinned: !!message.pinned, count, round };
    if (timed(message)) {
        entry.timer = createTimer(() => {
            drop(entry);
            emit('life-end', { message: entry.message });
        }, message.life!);
    }
    return entry;
}

function drop(entry: Entry) {
    entry.timer?.stop();
    entries.value = entries.value.filter((e) => e !== entry);
    entry.message.onClose?.(entry.message);
}

/** Puts a new entry where an old one was, the old one's countdown stopped. */
function replace(old: Entry, next: Entry) {
    old.timer?.stop();
    entries.value = entries.value.map((e) => (e === old ? next : e));
}

function add(message: ToastMessage) {
    if ((message.group ?? undefined) !== (props.group ?? undefined)) return;
    // The same id again updates the card in place instead of adding a second one.
    const same = message.id !== undefined ? entries.value.find((e) => e.message.id === message.id) : undefined;
    if (same) return replace(same, makeEntry(message, same.key, same.count, same.round + 1));
    // The same collapseKey joins the card already up, and counts.
    const kin = message.collapseKey ? entries.value.find((e) => e.message.collapseKey === message.collapseKey) : undefined;
    if (kin) return replace(kin, makeEntry(message, kin.key, kin.count + 1, kin.round + 1));
    if (props.overflow === 'replace') {
        const oldest = toastToReplace(entries.value, props.max);
        if (oldest && !message.pinned) drop(oldest);
    }
    entries.value = [...entries.value, makeEntry(message, message.id ?? `vt-toast-${++counter}`)];
}

function update({ id, patch }: { id: string | number; patch: Partial<ToastMessage> }) {
    const entry = entries.value.find((e) => e.message.id === id);
    if (entry) replace(entry, makeEntry({ ...entry.message, ...patch }, entry.key, entry.count, entry.round + 1));
}

function remove(message: ToastMessage) {
    const entry = entries.value.find((e) => e.message === message || (message.id !== undefined && e.message.id === message.id));
    if (entry) drop(entry);
}

function clear() {
    const gone = entries.value;
    gone.forEach((e) => e.timer?.stop());
    entries.value = [];
    gone.forEach((e) => e.message.onClose?.(e.message));
}

function close(entry: Entry) {
    drop(entry);
    emit('close', { message: entry.message });
}

function runAction(entry: Entry, action: ToastAction) {
    action.onClick?.(entry.message);
    emit('action', { message: entry.message, action });
    if (!action.keepOpen) drop(entry);
}

// A countdown starts when its card comes into view; one already running is left alone.
const started = new WeakSet<Timer>();
watch(
    shown,
    (list) => {
        for (const entry of list) {
            if (entry.timer && !started.has(entry.timer)) {
                started.add(entry.timer);
                entry.timer.start();
                if (expanded.value) entry.timer.pause('stack');
                if (pageHidden()) entry.timer.pause('hidden');
            }
        }
    },
    { immediate: true }
);

const offs = [
    context.toast.on('add', add),
    context.toast.on('update', update),
    context.toast.on('remove', remove),
    context.toast.on('removeGroup', (group) => {
        if (group === props.group) clear();
    }),
    context.toast.on('removeAll', clear)
];

// ---- the page in the background --------------------------------------------

const pageHidden = () => props.pauseOnPageHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden';

function onVisibility() {
    const hidden = pageHidden();
    for (const entry of entries.value) {
        if (hidden) entry.timer?.pause('hidden');
        else entry.timer?.resume('hidden');
    }
}

onMounted(() => document.addEventListener('visibilitychange', onVisibility));

// ---- the pile -------------------------------------------------------------

function setExpanded(next: boolean) {
    if (!props.stacked || expanded.value === next) return;
    expanded.value = next;
    for (const entry of entries.value) {
        if (next) entry.timer?.pause('stack');
        else entry.timer?.resume('stack');
    }
}

function onRootFocusOut(event: FocusEvent) {
    if (!rootRef.value?.contains(event.relatedTarget as Node | null)) setExpanded(false);
}

// ---- a swipe to close -----------------------------------------------------

/** The card being swiped and how far it has gone. */
const swipe = ref<{ key: string | number; id: number; x: number; dx: number } | null>(null);
const SWIPE_DISTANCE = 80;

function onPointerdown(entry: Entry, event: PointerEvent) {
    // A mouse selects text; only a finger or a pen swipes.
    if (!props.swipeToClose || event.pointerType === 'mouse' || (event.target as Element).closest('button')) return;
    swipe.value = { key: entry.key, id: event.pointerId, x: event.clientX, dx: 0 };
}

function onPointermove(event: PointerEvent) {
    if (!swipe.value || event.pointerId !== swipe.value.id) return;
    const dx = event.clientX - swipe.value.x;
    if (Math.abs(dx) > 6) (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    swipe.value = { ...swipe.value, dx };
}

function onPointerup(entry: Entry, event: PointerEvent) {
    if (!swipe.value || event.pointerId !== swipe.value.id) return;
    const far = Math.abs(swipe.value.dx) >= SWIPE_DISTANCE;
    swipe.value = null;
    if (far) close(entry);
}

function swipeStyle(entry: Entry) {
    if (swipe.value?.key !== entry.key) return undefined;
    const dx = swipe.value.dx;
    return { transform: `translateX(${dx}px)`, opacity: String(Math.max(0, 1 - Math.abs(dx) / (SWIPE_DISTANCE * 2.5))), transition: 'none' };
}

// ---- stacking -------------------------------------------------------------

// Stack above whatever is open when the first card arrives; step down once the
// last one has finished leaving.
watch(
    () => entries.value.length > 0,
    (has) => {
        if (has && !layered && rootRef.value) {
            ZIndex.set('toast', rootRef.value, config.zIndex.toast);
            layered = true;
        }
    },
    { flush: 'post' }
);

function onAfterLeave() {
    if (entries.value.length === 0) setExpanded(false);
    if (entries.value.length === 0 && layered) {
        ZIndex.clear(rootRef.value);
        layered = false;
    }
}

function onFocusOut(entry: Entry, event: FocusEvent) {
    const card = event.currentTarget as HTMLElement;
    if (!card.contains(event.relatedTarget as Node | null)) entry.timer?.resume('focus');
}

onBeforeUnmount(() => {
    offs.forEach((off) => off());
    document.removeEventListener('visibilitychange', onVisibility);
    entries.value.forEach((e) => e.timer?.stop());
    if (layered) ZIndex.clear(rootRef.value);
});

const showsProgress = (entry: Entry) => !!entry.timer && (entry.message.progress ?? props.showProgress);
const iconOf = (message: ToastMessage) => (message.loading ? 'spinner' : (message.icon ?? severityIcon(message.severity)));

defineExpose({ add, update, remove, clear });
</script>

<template>
    <Teleport :to="overlayTarget">
        <div
            ref="rootRef"
            v-bind="part('root', { position, stacked, expanded })"
            @mouseenter="setExpanded(true)"
            @mouseleave="setExpanded(false)"
            @focusin="setExpanded(true)"
            @focusout="onRootFocusOut"
        >
            <TransitionGroup name="vt-toast-motion" @after-leave="onAfterLeave">
                <div
                    v-for="(entry, index) in shown"
                    :key="entry.key"
                    v-bind="part('message', { severity: entry.message.severity, pinned: entry.pinned })"
                    :style="[{ '--vt-toast-index': index }, swipeStyle(entry)]"
                    :inert="stacked && !expanded && index > 0 ? true : undefined"
                    @mouseenter="entry.timer?.pause('hover')"
                    @mouseleave="entry.timer?.resume('hover')"
                    @focusin="entry.timer?.pause('focus')"
                    @focusout="onFocusOut(entry, $event)"
                    @pointerdown="onPointerdown(entry, $event)"
                    @pointermove="onPointermove"
                    @pointerup="onPointerup(entry, $event)"
                    @pointercancel="swipe = null"
                >
                    <div v-if="$slots.container" v-bind="liveRegion(entry.message.severity)" style="display: contents">
                        <slot name="container" :message="entry.message" :close-callback="() => close(entry)" />
                    </div>
                    <template v-else>
                        <div v-bind="mergeProps(liveRegion(entry.message.severity), part('messageContent'))">
                            <slot name="message" :message="entry.message">
                                <Icon :icon="iconOf(entry.message)" :spin="entry.message.loading" v-bind="part('messageIcon')" />
                                <div v-bind="part('messageText')">
                                    <div v-if="entry.message.summary || entry.count > 1" v-bind="part('summary')">
                                        {{ entry.message.summary }}
                                        <span v-if="entry.count > 1" v-bind="part('count')">
                                            <span aria-hidden="true">×{{ entry.count }}</span>
                                            <span class="vt-sr-only">{{ formatMessage(locale.aria.toastRepeated, { count: entry.count }) }}</span>
                                        </span>
                                    </div>
                                    <div v-if="entry.message.detail" v-bind="part('detail')">{{ entry.message.detail }}</div>
                                </div>
                            </slot>
                        </div>
                        <div v-if="entry.message.actions?.length" v-bind="part('actions')">
                            <Button
                                v-for="action in entry.message.actions"
                                :key="action.label"
                                :label="action.label"
                                :severity="action.severity ?? 'secondary'"
                                size="small"
                                variant="outlined"
                                v-bind="part('actionButton')"
                                @click="runAction(entry, action)"
                            />
                        </div>
                        <button v-if="entry.message.closable !== false" type="button" :aria-label="locale.aria.close" v-bind="part('closeButton')" @click="close(entry)">
                            <slot name="closeicon">
                                <Icon icon="close" />
                            </slot>
                        </button>
                    </template>
                    <span
                        v-if="showsProgress(entry)"
                        :key="entry.round"
                        aria-hidden="true"
                        v-bind="part('progress')"
                        :style="{ animationDuration: `${entry.message.life}ms` }"
                    />
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>
