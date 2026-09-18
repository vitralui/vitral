<script setup lang="ts">
import { splitbuttonStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import Menu from '../Menu/Menu.vue';
import type { SplitButtonEmits, SplitButtonProps, SplitButtonSlots } from './types';

// Two real buttons: the command, and a menu button that opens a popup <Menu>
// (the WAI-ARIA menu button pattern) — Enter, Space or Down opens it with
// focus on the first item, Up on the last; Escape, Tab or a choice closes it
// and gives focus back. Attributes go to the main button.

defineOptions({ name: 'VtSplitButton', inheritAttrs: false });

const props = withDefaults(defineProps<SplitButtonProps>(), {
    unstyled: undefined,
    model: () => [],
    dropdownIcon: 'chevronDown',
    severity: 'primary',
    variant: 'filled',
    placement: 'bottom-end',
    appendTo: 'body'
});
const emit = defineEmits<SplitButtonEmits>();
const slots = defineSlots<SplitButtonSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(splitbuttonStyle, props);
const menuId = `${useId()}-menu`;
const menuRef = ref<InstanceType<typeof Menu> | null>(null);
const open = ref(false);

const buttonAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _class, style: _style, ...rest } = attrs;
    return rest;
});
const shared = computed(() => ({ severity: props.severity, variant: props.variant, size: props.size, rounded: props.rounded, raised: props.raised, unstyled: props.unstyled }));

function toggle(event: Event) {
    if (props.disabled) return;
    menuRef.value?.toggle(event);
}

function onDropdownKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (!open.value) menuRef.value?.show(event);
    // The Menu opens on its first item; Up asks for the last.
    if (event.key === 'ArrowUp') {
        setTimeout(() => {
            const items = document.getElementById(menuId)?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
            items?.[items.length - 1]?.focus();
        });
    }
}

function onShow() {
    open.value = true;
    emit('show');
}

function onHide() {
    open.value = false;
    emit('hide');
}
</script>

<template>
    <div :class="attrs.class" :style="attrs.style as never" v-bind="part('root', { rounded, fluid })">
        <Button
            v-bind="mergeProps(buttonAttrs, shared, part('button'))"
            :label="label"
            :icon="icon"
            :disabled="disabled"
            :loading="loading"
            @click="emit('click', $event)"
        >
            <template v-if="slots.default" #default><slot /></template>
            <template v-if="slots.icon" #icon><slot name="icon" /></template>
        </Button>
        <Button
            v-bind="mergeProps(shared, part('dropdown'))"
            :disabled="disabled"
            :aria-label="menuButtonLabel ?? locale.aria.moreOptions"
            aria-haspopup="menu"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open ? menuId : undefined"
            @click="toggle"
            @keydown="onDropdownKeydown"
        >
            <slot name="dropdownicon"><Icon :icon="dropdownIcon" /></slot>
        </Button>
        <Menu :id="menuId" ref="menuRef" :model="model" popup :placement="placement" :append-to="appendTo" :unstyled="unstyled" v-bind="part('menu')" @show="onShow" @hide="onHide">
            <template v-if="slots.item" #item="p"><slot name="item" v-bind="p" /></template>
        </Menu>
    </div>
</template>
