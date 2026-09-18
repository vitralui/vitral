<script setup lang="ts">
import { toggleswitchStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useId, useSlots } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import type { ToggleSwitchEmits, ToggleSwitchProps, ToggleSwitchSlots } from './types';

// The WAI-ARIA switch as a native checkbox with role="switch": Space toggles,
// forms submit it, and the header is its <label>. The on/off text beside it
// repeats the state that aria-checked already announces, so it is hidden from
// assistive technology — and it is not a <label>, which would fold "On" into
// the switch's name.

defineOptions({ name: 'VtToggleSwitch', inheritAttrs: false });

const props = withDefaults(defineProps<ToggleSwitchProps>(), { unstyled: undefined });
const model = defineModel<boolean>({ default: false });
const emit = defineEmits<ToggleSwitchEmits>();
defineSlots<ToggleSwitchSlots>();

const slots = useSlots();
const { part, locale } = useComponent(toggleswitchStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const generatedId = useId();
const inputId = computed(() => (controlAttrs.value.id as string | undefined) ?? generatedId);

const checked = computed(() => !!model.value);
const stateText = computed(() => {
    if (checked.value) return props.onLabel ?? (props.showStateLabel ? locale.value.on : undefined);
    return props.offLabel ?? (props.showStateLabel ? locale.value.off : undefined);
});
const hasContent = computed(() => !!slots.content || stateText.value !== undefined);

const state = computed(() => ({ checked: checked.value, invalid: props.invalid, disabled: props.disabled }));

function onChange(event: Event) {
    const next = !checked.value;
    model.value = next;
    // Until the parent re-renders, keep the switch showing what v-model says.
    (event.target as HTMLInputElement).checked = checked.value;
    emit('change', { originalEvent: event, checked: next });
}

// The on/off text toggles too, as the whole control does; the track is the input itself.
function onBodyClick(event: MouseEvent) {
    if (props.disabled || event.target === inputRef.value) return;
    inputRef.value?.click();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))">
        <label v-if="label || $slots.default" :for="inputId" v-bind="part('header')">
            <slot>{{ label }}</slot>
        </label>
        <div v-bind="part('body')" @click="onBodyClick">
            <span v-bind="part('track')">
                <input
                    ref="inputRef"
                    v-bind="mergeProps(controlAttrs, part('input'))"
                    :id="inputId"
                    type="checkbox"
                    role="switch"
                    :checked="checked"
                    :disabled="disabled"
                    :aria-invalid="invalid ? 'true' : undefined"
                    @change="onChange"
                    @focus="emit('focus', $event)"
                    @blur="emit('blur', $event)"
                />
                <span v-bind="part('knob')" />
            </span>
            <span v-if="hasContent" aria-hidden="true" v-bind="part('content')">
                <slot name="content" :checked="checked">{{ stateText }}</slot>
            </span>
        </div>
    </div>
</template>
