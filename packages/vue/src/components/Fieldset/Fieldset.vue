<script setup lang="ts">
import { fieldsetStyle } from '@vitral/styles';
import { computed, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useCollapseTransition } from '../../composables/useCollapseTransition';
import Icon from '../Icon/Icon.vue';
import type { FieldsetEmits, FieldsetProps, FieldsetSlots } from './types';

// A real <fieldset> and <legend>, so the grouping reaches assistive technology
// whatever the styling does. Toggleable, it is the WAI-ARIA disclosure
// pattern: the legend holds a button with aria-expanded, and the button also
// labels the region it controls.

defineOptions({ name: 'VtFieldset' });

const props = withDefaults(defineProps<FieldsetProps>(), { unstyled: undefined });
const collapsed = defineModel<boolean>('collapsed', { default: false });
const emit = defineEmits<FieldsetEmits>();
defineSlots<FieldsetSlots>();

const { part, locale } = useComponent(fieldsetStyle, props);
const collapse = useCollapseTransition();

const id = useId();
const toggleId = `${id}-toggle`;
const contentId = `${id}-content`;

const isCollapsed = computed(() => !!props.toggleable && collapsed.value);
const state = computed(() => ({ toggleable: props.toggleable, collapsed: isCollapsed.value }));
const iconState = computed(() => ({ open: !isCollapsed.value && !props.toggleIcon }));
const toggleLabel = computed(() => (props.legend ? undefined : isCollapsed.value ? locale.value.aria.expand : locale.value.aria.collapse));

function toggle(event: Event) {
    // A bound v-model only changes once the parent re-renders; report the value being asked for.
    const next = !collapsed.value;
    collapsed.value = next;
    emit('toggle', { originalEvent: event, value: next });
}

defineExpose({ toggle: () => toggle(new Event('toggle')) });
</script>

<template>
    <fieldset v-bind="part('root', state)">
        <legend v-bind="part('legend', state)">
            <button
                v-if="toggleable"
                :id="toggleId"
                type="button"
                :aria-expanded="isCollapsed ? 'false' : 'true'"
                :aria-controls="contentId"
                :aria-label="toggleLabel"
                v-bind="part('toggle', state)"
                @click="toggle"
            >
                <span v-bind="part('toggleIcon', iconState)" aria-hidden="true">
                    <slot name="toggleicon" :collapsed="isCollapsed">
                        <Icon :icon="toggleIcon ?? 'chevronDown'" />
                    </slot>
                </span>
                <slot name="legend">{{ legend }}</slot>
            </button>
            <span v-else v-bind="part('legendContent')">
                <slot name="legend">{{ legend }}</slot>
            </span>
        </legend>
        <Transition name="vt-fieldset-collapse" v-bind="collapse">
            <div
                v-show="!isCollapsed"
                :id="contentId"
                :role="toggleable ? 'region' : undefined"
                :aria-labelledby="toggleable ? toggleId : undefined"
                v-bind="part('contentContainer', state)"
            >
                <div v-bind="part('content')">
                    <slot />
                </div>
            </div>
        </Transition>
    </fieldset>
</template>
