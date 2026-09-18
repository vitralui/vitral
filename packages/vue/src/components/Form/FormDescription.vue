<script setup lang="ts">
import { formStyle } from '@vitral/styles';
import { getCurrentInstance, onBeforeUnmount } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, isAutoPart, useFieldContext } from './context';
import type { FormDescriptionProps, FormDescriptionSlots } from './types';

// A hint about the field, which describes the control.

defineOptions({ name: 'VtFormDescription' });

const props = withDefaults(defineProps<FormDescriptionProps>(), { unstyled: undefined, as: 'p' });
defineSlots<FormDescriptionSlots>();

const field = useFieldContext('FormDescription');
const { part } = useComponent(formStyle, inheritRoot(props, field));

if (!isAutoPart(getCurrentInstance()?.vnode.key)) onBeforeUnmount(field.registerPart('description'));
</script>

<template>
    <component :is="as" :id="field.ids.description" v-bind="part('description')">
        <slot>{{ field.descriptionProp() }}</slot>
    </component>
</template>
