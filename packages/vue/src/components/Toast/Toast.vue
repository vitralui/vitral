<script setup lang="ts">
import { createTimer, liveRegion, severityIcon, ZIndex, type Timer } from '@vitral/core';
import { toastStyle } from '@vitral/styles';
import { mergeProps, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ToastMessage } from '../../config/services';
import Icon from '../Icon/Icon.vue';
import type { ToastEmits, ToastProps, ToastSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// Renders what useToast() sends. Each card's text sits in a live region — a
// polite `status`, or an `alert` for `danger` — with the close button outside
// it, so the announcement is the message and not "Close". A card with a `life`
// counts down only while nobody is pointing at it or working in it (WCAG 2.2.1).

defineOptions({ name: 'VtToast' });

const props = withDefaults(defineProps<ToastProps>(), { unstyled: undefined, position: 'top-right' });
const overlayTarget = useOverlayTarget();
const emit = defineEmits<ToastEmits>();
defineSlots<ToastSlots>();

const { part, context, config, locale } = useComponent(toastStyle, props);

interface Entry {
    key: string | number;
    message: ToastMessage;
    timer?: Timer;
}

const entries = shallowRef<Entry[]>([]);
const rootRef = ref<HTMLElement | null>(null);
let stacked = false;
let counter = 0;

function drop(entry: Entry) {
    entry.timer?.stop();
    entries.value = entries.value.filter((e) => e !== entry);
}

function add(message: ToastMessage) {
    if ((message.group ?? undefined) !== (props.group ?? undefined)) return;
    const entry: Entry = { key: message.id ?? `vt-toast-${++counter}`, message };
    if (message.life && message.life > 0) {
        entry.timer = createTimer(() => {
            drop(entry);
            emit('life-end', { message });
        }, message.life);
        entry.timer.start();
    }
    // The same id again updates the card in place instead of adding a second one.
    const existing = message.id !== undefined ? entries.value.find((e) => e.message.id === message.id) : undefined;
    if (existing) {
        existing.timer?.stop();
        entries.value = entries.value.map((e) => (e === existing ? entry : e));
    } else {
        entries.value = [...entries.value, entry];
    }
}

function remove(message: ToastMessage) {
    const entry = entries.value.find((e) => e.message === message || (message.id !== undefined && e.message.id === message.id));
    if (entry) drop(entry);
}

function clear() {
    entries.value.forEach((e) => e.timer?.stop());
    entries.value = [];
}

function close(entry: Entry) {
    drop(entry);
    emit('close', { message: entry.message });
}

const offs = [
    context.toast.on('add', add),
    context.toast.on('remove', remove),
    context.toast.on('removeGroup', (group) => {
        if (group === props.group) clear();
    }),
    context.toast.on('removeAll', clear)
];

// Stack above whatever is open when the first card arrives; step down once the
// last one has finished leaving.
watch(
    () => entries.value.length > 0,
    (has) => {
        if (has && !stacked && rootRef.value) {
            ZIndex.set('toast', rootRef.value, config.zIndex.toast);
            stacked = true;
        }
    },
    { flush: 'post' }
);

function onAfterLeave() {
    if (entries.value.length === 0 && stacked) {
        ZIndex.clear(rootRef.value);
        stacked = false;
    }
}

function onFocusOut(entry: Entry, event: FocusEvent) {
    const card = event.currentTarget as HTMLElement;
    if (!card.contains(event.relatedTarget as Node | null)) entry.timer?.resume('focus');
}

onBeforeUnmount(() => {
    offs.forEach((off) => off());
    entries.value.forEach((e) => e.timer?.stop());
    if (stacked) ZIndex.clear(rootRef.value);
});

defineExpose({ add, remove, clear });
</script>

<template>
    <Teleport :to="overlayTarget">
        <div ref="rootRef" v-bind="part('root', { position })">
            <TransitionGroup name="vt-toast-motion" @after-leave="onAfterLeave">
                <div
                    v-for="entry in entries"
                    :key="entry.key"
                    v-bind="part('message', { severity: entry.message.severity })"
                    @mouseenter="entry.timer?.pause('hover')"
                    @mouseleave="entry.timer?.resume('hover')"
                    @focusin="entry.timer?.pause('focus')"
                    @focusout="onFocusOut(entry, $event)"
                >
                    <div v-if="$slots.container" v-bind="liveRegion(entry.message.severity)" style="display: contents">
                        <slot name="container" :message="entry.message" :close-callback="() => close(entry)" />
                    </div>
                    <template v-else>
                        <div v-bind="mergeProps(liveRegion(entry.message.severity), part('messageContent'))">
                            <slot name="message" :message="entry.message">
                                <Icon :icon="entry.message.icon ?? severityIcon(entry.message.severity)" v-bind="part('messageIcon')" />
                                <div v-bind="part('messageText')">
                                    <div v-if="entry.message.summary" v-bind="part('summary')">{{ entry.message.summary }}</div>
                                    <div v-if="entry.message.detail" v-bind="part('detail')">{{ entry.message.detail }}</div>
                                </div>
                            </slot>
                        </div>
                        <button v-if="entry.message.closable !== false" type="button" :aria-label="locale.aria.close" v-bind="part('closeButton')" @click="close(entry)">
                            <slot name="closeicon">
                                <Icon icon="x" />
                            </slot>
                        </button>
                    </template>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>
