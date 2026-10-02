<script setup lang="ts">
import { scrollpanelStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useAttrs } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useScrollbars } from '../../base/useScrollbars';
import type { ScrollPanelProps, ScrollPanelSlots } from './types';

// A scroll container with the theme's own bars. The content keeps native
// scrolling (wheel, touch, and the keyboard, since the content area is a
// focusable region) and only the drawing of the bars is replaced. The drawn
// bars are for the pointer and hidden from assistive technology. Size it with
// `style`; name it with `aria-label` when it holds more than decoration.

defineOptions({ name: 'VtScrollPanel', inheritAttrs: false });

const props = withDefaults(defineProps<ScrollPanelProps>(), { unstyled: undefined });
defineSlots<ScrollPanelSlots>();
const attrs = useAttrs();

const { part } = useComponent(scrollpanelStyle, props);
const contentRef = ref<HTMLElement | null>(null);

const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const contentAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _c, style: _s, ...rest } = attrs;
    return rest;
});

const { refresh } = useScrollbars(contentRef, props, { ownPassThrough: true });

/** Scrolls the content to `top`. */
function scrollTop(top: number) {
    if (contentRef.value) contentRef.value.scrollTop = top;
    refresh();
}

defineExpose({ scrollTop, refresh, content: contentRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root'))">
        <div ref="contentRef" tabindex="0" v-bind="mergeProps(contentAttrs, part('content'))">
            <slot />
        </div>
    </div>
</template>
