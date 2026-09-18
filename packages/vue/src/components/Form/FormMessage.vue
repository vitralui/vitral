<script setup lang="ts">
import { formStyle } from '@vitral/styles';
import { computed, getCurrentInstance, onBeforeUnmount } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import { inheritRoot, isAutoPart, useFieldContext } from './context';
import type { FormMessageProps, FormMessageSlots } from './types';

// The field's error. The element stays in the page while empty — it is a
// polite live region, so an error that appears as the user types or leaves the
// field is read out. After a submit it is silent: the summary, or the focus
// moving to the field (which it describes), already says it.

defineOptions({ name: 'VtFormMessage' });

const props = withDefaults(defineProps<FormMessageProps>(), { unstyled: undefined, all: false, hideIcon: false });
defineSlots<FormMessageSlots>();

const field = useFieldContext('FormMessage');
const { part } = useComponent(formStyle, inheritRoot(props, field));

if (!isAutoPart(getCurrentInstance()?.vnode.key)) onBeforeUnmount(field.registerPart('message'));

const errors = computed(() => (field.state.value.invalid ? field.state.value.errors : []));
const text = computed(() => (props.all ? errors.value.join(' ') : errors.value[0]));
</script>

<template>
    <p :id="field.ids.message" v-bind="part('message')" :aria-live="field.quiet.value ? 'off' : 'polite'" aria-atomic="true"><template v-if="errors.length"><Icon v-if="!hideIcon" icon="error" v-bind="part('messageIcon')" /><slot :error="errors[0]!" :errors="errors"><span>{{ text }}</span></slot></template></p>
</template>
