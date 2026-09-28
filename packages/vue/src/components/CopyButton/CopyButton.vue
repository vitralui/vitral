<script setup lang="ts">
import { copybuttonStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import type { CopyButtonEmits, CopyButtonProps } from './types';

defineOptions({ name: 'VtCopyButton', inheritAttrs: false });

const props = withDefaults(defineProps<CopyButtonProps>(), { unstyled: undefined, severity: 'secondary', variant: 'text', timeout: 2000 });
const emit = defineEmits<CopyButtonEmits>();

const { part, locale, unstyled } = useComponent(copybuttonStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const copied = ref(false);
/** Emptied first and filled a tick later, so copying twice is announced twice. */
const status = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

async function write(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    // An insecure page has no clipboard API; a selected text box and the old command still work there.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand?.('copy');
    area.remove();
    if (!ok) throw new Error('Copying is not available here');
}

async function copy() {
    try {
        const text = typeof props.value === 'function' ? await props.value() : (props.value ?? '');
        await write(text);
        copied.value = true;
        status.value = '';
        setTimeout(() => (status.value = locale.value.aria.copied));
        emit('copy', text);
        clearTimeout(timer);
        timer = setTimeout(() => {
            copied.value = false;
            status.value = '';
        }, props.timeout);
    } catch (error) {
        emit('error', error);
    }
}

onBeforeUnmount(() => clearTimeout(timer));

const shownLabel = computed(() => (copied.value && props.copiedLabel ? props.copiedLabel : props.label));
</script>

<template>
    <span v-bind="{ ...part('root'), ...rootAttrs }">
        <Button
            :label="shownLabel"
            :icon="copied ? 'check' : 'copy'"
            :severity="severity"
            :variant="variant"
            :size="size"
            :rounded="rounded"
            :disabled="disabled"
            :unstyled="unstyled"
            :aria-label="label ? undefined : locale.aria.copy"
            v-bind="{ ...part('button', { copied }), ...controlAttrs }"
            @click="copy"
        />
        <span role="status" class="vt-sr-only" v-bind="part('status')">{{ status }}</span>
    </span>
</template>
