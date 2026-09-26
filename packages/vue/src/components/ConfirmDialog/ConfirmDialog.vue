<script setup lang="ts">
import { severityIcon } from '@vitral/core';
import { confirmdialogStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, ref, shallowRef, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ConfirmOptions } from '../../config/services';
import Button from '../Button/Button.vue';
import Dialog from '../Dialog/Dialog.vue';
import Icon from '../Icon/Icon.vue';
import type { ConfirmDialogProps, ConfirmDialogSlots } from './types';

// What useConfirm().require() opens: a <Dialog> as a WAI-ARIA alertdialog,
// described by its message, with focus on the button `defaultFocus` names,
// usually `reject` for a destructive action so a stray Enter does no harm.

defineOptions({ name: 'VtConfirmDialog' });

const props = withDefaults(defineProps<ConfirmDialogProps>(), { unstyled: undefined, draggable: true, keepInViewport: true });
defineSlots<ConfirmDialogSlots>();

const { part, context, locale } = useComponent(confirmdialogStyle, props);
const messageId = `${useId()}-message`;

const visible = ref(false);
const options = shallowRef<ConfirmOptions>({});

const iconName = computed(() => {
    const { icon, severity } = options.value;
    if (icon) return icon;
    return severity === 'success' || severity === 'info' || severity === 'warn' || severity === 'danger' ? severityIcon(severity) : undefined;
});
const focusReject = computed(() => options.value.defaultFocus === 'reject');

const offs = [
    context.confirm.on('require', (next) => {
        // A request about a particular element is ConfirmPopup's.
        if ((next.group ?? undefined) !== (props.group ?? undefined) || next.target) return;
        options.value = next;
        visible.value = true;
    }),
    context.confirm.on('close', () => {
        visible.value = false;
    })
];
onBeforeUnmount(() => offs.forEach((off) => off()));

function accept() {
    visible.value = false;
    options.value.accept?.();
}

function reject() {
    visible.value = false;
    options.value.reject?.();
}

// Closed without an answer: Escape or the close button.
function onUpdateVisible(open: boolean) {
    if (open) return;
    visible.value = false;
    options.value.onHide?.();
}
</script>

<template>
    <Dialog
        :visible="visible"
        role="alertdialog"
        :header="options.header"
        :aria-label="options.header ? undefined : locale.aria.confirmation"
        :aria-describedby="messageId"
        :draggable="draggable"
        :keep-in-viewport="keepInViewport"
        :unstyled="unstyled"
        :pt="pt"
        :dt="dt"
        @update:visible="onUpdateVisible"
    >
        <div v-bind="part('body')">
            <slot name="icon" :message="options">
                <Icon v-if="iconName" :icon="iconName" v-bind="part('icon', { severity: options.severity })" />
            </slot>
            <div :id="messageId" v-bind="part('message')">
                <slot name="message" :message="options">{{ options.message }}</slot>
            </div>
        </div>
        <template #footer>
            <Button :label="options.rejectLabel ?? locale.reject" severity="secondary" :autofocus="focusReject" :unstyled="unstyled" @click="reject" />
            <Button :label="options.acceptLabel ?? locale.accept" :severity="options.severity ?? 'primary'" :autofocus="!focusReject" :unstyled="unstyled" @click="accept" />
        </template>
    </Dialog>
</template>
