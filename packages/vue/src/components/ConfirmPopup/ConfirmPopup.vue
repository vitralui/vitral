<script setup lang="ts">
import { severityIcon } from '@vitral/core';
import { confirmpopupStyle } from '@vitral/styles';
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useFocusTrap } from '../../composables/useFocusTrap';
import { useOverlay } from '../../composables/useOverlay';
import type { ConfirmOptions } from '../../config/services';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import type { ConfirmPopupProps, ConfirmPopupSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// What useConfirm().require({ target }) opens: a WAI-ARIA alertdialog anchored
// to the element the question is about, named by its header (or "Confirmation")
// and described by its message. Focus goes to the button `defaultFocus` names
// and stays inside until the question is answered; Escape or a press outside
// closes it unanswered. Focus then goes back to the target.

defineOptions({ name: 'VtConfirmPopup' });

const props = withDefaults(defineProps<ConfirmPopupProps>(), { unstyled: undefined, placement: 'bottom' });
const overlayTarget = useOverlayTarget();
defineSlots<ConfirmPopupSlots>();

const { part, context, locale } = useComponent(confirmpopupStyle, props);
const id = useId();
const messageId = `${id}-message`;
const headerId = `${id}-header`;

const visible = ref(false);
const options = shallowRef<ConfirmOptions>({});
const panelRef = ref<HTMLElement | null>(null);
const acceptRef = ref<InstanceType<typeof Button> | null>(null);
const rejectRef = ref<InstanceType<typeof Button> | null>(null);
const target = computed(() => options.value.target ?? null);

const iconName = computed(() => {
    const { icon, severity } = options.value;
    if (icon) return icon;
    return severity === 'success' || severity === 'info' || severity === 'warn' || severity === 'danger' ? severityIcon(severity) : undefined;
});

useOverlay({
    anchor: target,
    overlay: panelRef,
    placement: () => props.placement,
    offset: 8,
    onEscape: () => dismiss(),
    onPointerDownOutside: () => dismiss(false)
});
useFocusTrap(panelRef, visible, { initialFocus: false, returnFocus: false });

watch(
    panelRef,
    (panel) => {
        if (!panel) return;
        const which = options.value.defaultFocus === 'reject' ? rejectRef : acceptRef;
        ((which.value?.$el as HTMLElement | undefined) ?? panel).focus({ preventScroll: true });
    },
    { flush: 'post' }
);

const offs = [
    context.confirm.on('require', (next) => {
        if ((next.group ?? undefined) !== (props.group ?? undefined) || !next.target) return;
        if (visible.value) close(false);
        nextTick(() => {
            options.value = next;
            visible.value = true;
        });
    }),
    context.confirm.on('close', () => close())
];
onBeforeUnmount(() => offs.forEach((off) => off()));

function close(returnFocus = true) {
    if (!visible.value) return;
    visible.value = false;
    const to = options.value.target;
    if (returnFocus && to?.isConnected) to.focus({ preventScroll: true });
}

function accept() {
    close();
    options.value.accept?.();
}

function reject() {
    close();
    options.value.reject?.();
}

function dismiss(returnFocus = true) {
    close(returnFocus);
    options.value.onHide?.();
}
</script>

<template>
    <Teleport :to="overlayTarget">
        <Transition name="vt-overlay">
            <div
                v-if="visible"
                ref="panelRef"
                role="alertdialog"
                :aria-labelledby="options.header ? headerId : undefined"
                :aria-label="options.header ? undefined : locale.aria.confirmation"
                :aria-describedby="messageId"
                v-bind="part('root')"
            >
                <div v-bind="part('content')">
                    <slot name="icon" :message="options">
                        <Icon v-if="iconName" :icon="iconName" v-bind="part('icon', { severity: options.severity })" />
                    </slot>
                    <div v-bind="part('message')">
                        <strong v-if="options.header" :id="headerId" v-bind="part('header')">{{ options.header }}</strong>
                        <span :id="messageId">
                            <slot name="message" :message="options">{{ options.message }}</slot>
                        </span>
                    </div>
                </div>
                <div v-bind="part('footer')">
                    <Button ref="rejectRef" :label="options.rejectLabel ?? locale.reject" severity="secondary" variant="text" size="small" :unstyled="unstyled" @click="reject" />
                    <Button ref="acceptRef" :label="options.acceptLabel ?? locale.accept" :severity="options.severity ?? 'primary'" size="small" :unstyled="unstyled" @click="accept" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
