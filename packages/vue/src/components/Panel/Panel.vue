<script setup lang="ts">
import { panelStyle } from '@vitral/styles';
import { computed, useId, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useCollapseTransition } from '../../composables/useCollapseTransition';
import Icon from '../Icon/Icon.vue';
import type { PanelEmits, PanelProps, PanelSlots } from './types';

// A toggleable panel follows the WAI-ARIA disclosure pattern: the header is a
// real <button> with aria-expanded, controlling a region it also labels.

defineOptions({ name: 'VtPanel' });

const props = withDefaults(defineProps<PanelProps>(), { unstyled: undefined });
const collapsed = defineModel<boolean>('collapsed', { default: false });
const emit = defineEmits<PanelEmits>();
defineSlots<PanelSlots>();

const slots = useSlots();
const { part, locale } = useComponent(panelStyle, props);
const collapse = useCollapseTransition();

const id = useId();
const headerId = `${id}-header`;
const contentId = `${id}-content`;

const isCollapsed = computed(() => !!props.toggleable && collapsed.value);
const hasHeader = computed(() => !!(props.header || props.toggleable || slots.header || slots.icons));
const hasTitle = computed(() => !!(props.header || slots.header));
const state = computed(() => ({ toggleable: props.toggleable, collapsed: isCollapsed.value }));
const iconState = computed(() => ({ open: !isCollapsed.value && !props.toggleIcon && !slots.toggleicon }));
// A toggle with no header text still needs a name.
const toggleLabel = computed(() => (hasTitle.value ? undefined : isCollapsed.value ? locale.value.aria.expand : locale.value.aria.collapse));

function toggle(event: Event) {
    // A bound v-model only changes once the parent re-renders; report the value being asked for.
    const next = !collapsed.value;
    collapsed.value = next;
    emit('toggle', { originalEvent: event, value: next });
}

defineExpose({ toggle: () => toggle(new Event('toggle')) });
</script>

<template>
    <div v-bind="part('root', state)">
        <div v-if="hasHeader" v-bind="part('header', state)">
            <button
                v-if="toggleable"
                :id="headerId"
                type="button"
                :aria-expanded="isCollapsed ? 'false' : 'true'"
                :aria-controls="contentId"
                :aria-label="toggleLabel"
                v-bind="part('toggle', state)"
                @click="toggle"
            >
                <span v-bind="part('title')">
                    <slot name="header">{{ header }}</slot>
                </span>
                <span v-bind="part('toggleIcon', iconState)" aria-hidden="true">
                    <slot name="toggleicon" :collapsed="isCollapsed">
                        <Icon :icon="toggleIcon ?? 'chevronDown'" />
                    </slot>
                </span>
            </button>
            <span v-else :id="headerId" v-bind="part('title')">
                <slot name="header">{{ header }}</slot>
            </span>
            <div v-if="$slots.icons" v-bind="part('icons')">
                <slot name="icons" />
            </div>
        </div>
        <Transition name="vt-panel-collapse" v-bind="collapse">
            <div
                v-show="!isCollapsed"
                :id="contentId"
                :role="toggleable ? 'region' : undefined"
                :aria-labelledby="toggleable ? headerId : undefined"
                v-bind="part('contentContainer', state)"
            >
                <div v-bind="part('content')">
                    <slot />
                </div>
                <div v-if="$slots.footer" v-bind="part('footer')">
                    <slot name="footer" />
                </div>
            </div>
        </Transition>
    </div>
</template>
