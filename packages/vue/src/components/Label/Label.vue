<script setup lang="ts">
import { isClient } from '@vitral/core';
import { labelStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { LabelProps, LabelSlots } from './types';

// A native <label>. Its `for` is checked once the page is rendered: the target
// has to exist and be a control a label can name (an input, a select, a
// textarea, a button…). A component whose root is not one, such as a radio
// group or a knob, is named with `aria-labelledby` pointing at the label's `id`,
// and in development a warning says so. The target's disabled state is
// followed, so the label dims with its control.

defineOptions({ name: 'VtLabel' });

const props = withDefaults(defineProps<LabelProps>(), { unstyled: undefined, disabled: undefined });
defineSlots<LabelSlots>();

const { part } = useComponent(labelStyle, props);

const LABELABLE = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS']);
const targetDisabled = ref(false);
let observer: MutationObserver | null = null;

function check() {
    observer?.disconnect();
    targetDisabled.value = false;
    if (!isClient || !props.for) return;
    const target = document.getElementById(props.for);
    const labelable = !!target && LABELABLE.has(target.tagName) && (target as HTMLInputElement).type !== 'hidden';
    if (!labelable) {
        if (import.meta.env?.DEV) {
            console.warn(
                target
                    ? `[vitral] <Label for="${props.for}"> points at a <${target.tagName.toLowerCase()}>, which a label cannot name; give the label an id and the control aria-labelledby.`
                    : `[vitral] <Label for="${props.for}"> points at no element.`
            );
        }
        return;
    }
    const read = () => (targetDisabled.value = (target as HTMLInputElement).disabled);
    read();
    if (typeof MutationObserver === 'function') {
        observer = new MutationObserver(read);
        observer.observe(target, { attributes: true, attributeFilter: ['disabled'] });
    }
}

// Controls are often rendered after their label; look once everything is in place.
onMounted(() => setTimeout(check));
watch(() => props.for, check, { flush: 'post' });
onBeforeUnmount(() => observer?.disconnect());

const state = computed(() => ({ size: props.size, disabled: props.disabled ?? targetDisabled.value }));
</script>

<template>
    <label :for="props.for" v-bind="part('root', state)">
        <slot />
        <span v-if="required" aria-hidden="true" v-bind="part('required')"><slot name="required">*</slot></span>
    </label>
</template>
