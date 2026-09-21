<script setup lang="ts">
import { createTimer, liveRegion, severityIcon } from '@vitral/core';
import { messageStyle } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, onMounted, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { MessageEmits, MessageProps, MessageSlots } from './types';

// The message band. The icon and text form a live
// region (an alert for `danger` and `warn`, a polite status otherwise), and
// the action and close button sit outside it, so only the message is read.

defineOptions({ name: 'VtMessage' });

const props = withDefaults(defineProps<MessageProps>(), { unstyled: undefined, severity: 'info', variant: 'subtle' });
const emit = defineEmits<MessageEmits>();
defineSlots<MessageSlots>();

const { part, locale } = useComponent(messageStyle, props);
const visible = ref(true);

const state = computed(() => ({ severity: props.severity, variant: props.variant }));
const region = computed(() => liveRegion(props.severity, ['danger', 'warn']));
const icon = computed(() => props.icon ?? severityIcon(props.severity));

const timer = props.life && props.life > 0 ? createTimer(() => {
    visible.value = false;
    emit('life-end');
}, props.life) : null;

onMounted(() => timer?.start());
onBeforeUnmount(() => timer?.stop());

function close(event: Event) {
    timer?.stop();
    visible.value = false;
    emit('close', event);
}

function onFocusOut(event: FocusEvent) {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) timer?.resume('focus');
}

defineExpose({ close: () => close(new Event('close')) });
</script>

<template>
    <Transition name="vt-message-motion">
        <div
            v-if="visible"
            v-bind="part('root', state)"
            @mouseenter="timer?.pause('hover')"
            @mouseleave="timer?.resume('hover')"
            @focusin="timer?.pause('focus')"
            @focusout="onFocusOut"
        >
            <div v-bind="mergeProps(region, part('content'))">
                <slot v-if="!hideIcon" name="icon">
                    <Icon :icon="icon" v-bind="part('icon')" />
                </slot>
                <div v-bind="part('body')">
                    <div v-if="title" v-bind="part('title')">{{ title }}</div>
                    <div v-if="$slots.default" v-bind="part('text')"><slot /></div>
                </div>
            </div>
            <div v-if="$slots.action" v-bind="part('action')">
                <slot name="action" />
            </div>
            <button v-if="closable" type="button" :aria-label="locale.aria.close" v-bind="part('closeButton')" @click="close">
                <slot name="closeicon">
                    <Icon icon="close" />
                </slot>
            </button>
        </div>
    </Transition>
</template>
