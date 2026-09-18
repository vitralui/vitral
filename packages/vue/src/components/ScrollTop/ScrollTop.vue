<script setup lang="ts">
import { getFocusableElements, isClient } from '@vitral/core';
import { scrolltopStyle } from '@vitral/styles';
import { mergeProps, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import type { ScrollTopEmits, ScrollTopProps } from './types';

// A button, named "Scroll to top", that appears once the page (or its parent)
// is scrolled past `threshold`. Pressing it scrolls back and, since the button
// then disappears from under the keyboard, moves focus to the start of what
// was scrolled, so keyboard users are left where they asked to go.

defineOptions({ name: 'VtScrollTop', inheritAttrs: false });

const props = withDefaults(defineProps<ScrollTopProps>(), { unstyled: undefined, target: 'window', threshold: 400, icon: 'arrowUp', behavior: 'smooth', severity: 'primary' });
const emit = defineEmits<ScrollTopEmits>();

const { part, locale } = useComponent(scrolltopStyle, props);
const attrs = useAttrs();
const anchorRef = ref<HTMLElement | null>(null);
const visible = ref(false);
let scroller: HTMLElement | Window | null = null;

const offsetOf = () => (scroller === window ? window.scrollY : ((scroller as HTMLElement | null)?.scrollTop ?? 0));
const onScroll = () => (visible.value = offsetOf() > props.threshold);

onMounted(() => {
    if (!isClient) return;
    scroller = props.target === 'parent' ? (anchorRef.value?.parentElement ?? null) : window;
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
});
onBeforeUnmount(() => scroller?.removeEventListener('scroll', onScroll));

function onClick(event: MouseEvent) {
    emit('click', event);
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduced ? 'auto' : props.behavior;
    const container = scroller === window ? document.documentElement : (scroller as HTMLElement | null);
    if (scroller && typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0, behavior });
    else if (container) container.scrollTop = 0;
    // Only a keyboard press loses its place; a pointer does not need moving.
    if (event.detail === 0 && container) {
        const first = container === document.documentElement ? getFocusableElements(document.body)[0] : getFocusableElements(container)[0];
        first?.focus({ preventScroll: true });
    }
    visible.value = false;
}
</script>

<template>
    <span ref="anchorRef" hidden />
    <Transition name="vt-scrolltop">
        <Button
            v-if="visible"
            :icon="icon"
            rounded
            :severity="severity"
            :unstyled="unstyled"
            :aria-label="locale.aria.scrollTop"
            v-bind="mergeProps(attrs, part('root', { target }))"
            @click="onClick"
        />
    </Transition>
</template>
