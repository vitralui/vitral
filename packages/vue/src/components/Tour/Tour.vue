<script setup lang="ts">
import { mergeAttrs, type PassThrough, type PassThroughContext as DomPassThroughContext } from '@vitral/dom';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import { createTour, type TourConfig, type TourHandle } from '@vitral/tour';
import { getCurrentInstance, h, normalizeClass, normalizeStyle, onBeforeUnmount, onMounted, render, toRaw, watch, type ComponentInternalInstance } from 'vue';
import type { PassThroughAttrs, PassThroughContext, PassThroughValue } from '../../base/types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { useVitral } from '../../config/config';
import type { TourEmits, TourProps, TourSlots } from './types';

// The tour is `@vitral/tour`'s framework-free renderer; this component hands
// it the props, the Vitral configuration and the `content` slot, and turns
// `v-model:open` and `v-model:step` into starting, moving and ending it.

defineOptions({ name: 'VtTour' });

const props = withDefaults(defineProps<TourProps>(), {
    unstyled: undefined,
    // Absent rather than false: these default to true in the tour, and an
    // unset boolean prop is `false` to Vue.
    animate: undefined,
    allowClose: undefined,
    allowKeyboardControl: undefined,
    smoothScroll: undefined,
    disableActiveInteraction: undefined,
    showProgress: undefined,
    allowHtml: undefined,
    dismissableMask: undefined,
    arrow: undefined
});
const open = defineModel<boolean>('open', { default: false });
const step = defineModel<number | undefined>('step', { default: undefined });
const emit = defineEmits<TourEmits>();
const slots = defineSlots<TourSlots>();

const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget(() => props.appendTo);
const instance = getCurrentInstance() as ComponentInternalInstance & { provides: object };
let tour: TourHandle | null = null;

// ---- the content slot, rendered by Vue into a container the tour places

let container: HTMLElement | null = null;
function slotNode(context: Parameters<NonNullable<TourSlots['content']>>[0]): Node | null {
    if (!slots.content) return null;
    container ??= document.createElement('div');
    container.style.display = 'contents';
    const vnode = h({ setup: () => () => slots.content!(context) });
    vnode.appContext = instance.appContext;
    render(vnode, container);
    return container;
}

// ---- pass-through and design tokens, onto the tour's layer

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}
const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

function passThroughMap(): PassThrough {
    const names = new Set(['root', ...Object.keys(config.pt.tour ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries(
        [...names].map((part) => [
            part,
            (context: DomPassThroughContext) => {
                const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
                const own = part === 'root' && props.dt ? { style: flattenTokens(props.dt as TokenTree, [], theme?.options.prefix) } : {};
                return mergeAttrs(own, vueAttrs(resolve(config.pt.tour?.[part], ctx)), vueAttrs(resolve(props.pt?.[part], ctx)));
            }
        ])
    );
}

// ---- the tour

const defined = <T extends object>(value: T): Partial<T> => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;

const inputs = (): TourConfig => ({
    // The plugin's `tour` defaults, then `options`, then the props: the nearer, the stronger.
    ...toRaw(config.tour),
    ...toRaw(props.options),
    ...defined({
        steps: toRaw(props.steps),
        animate: props.animate,
        overlayColor: props.overlayColor,
        overlayOpacity: props.overlayOpacity,
        smoothScroll: props.smoothScroll,
        allowClose: props.allowClose,
        overlayClickBehavior: props.overlayClickBehavior,
        dismissableMask: props.dismissableMask,
        arrow: props.arrow,
        stagePadding: props.stagePadding,
        stageRadius: props.stageRadius,
        disableActiveInteraction: props.disableActiveInteraction,
        allowKeyboardControl: props.allowKeyboardControl,
        popoverClass: props.popoverClass,
        popoverOffset: props.popoverOffset,
        showButtons: props.showButtons,
        disableButtons: props.disableButtons,
        showProgress: props.showProgress,
        progressText: props.progressText,
        progressStyle: props.progressStyle,
        nextBtnText: props.nextBtnText,
        prevBtnText: props.prevBtnText,
        doneBtnText: props.doneBtnText,
        allowHtml: props.allowHtml,
        elementTimeout: props.elementTimeout,
        missingElement: props.missingElement,
        storageKey: props.storageKey
    }),
    locale: config.locale,
    unstyled: props.unstyled ?? config.unstyled,
    pt: passThroughMap(),
    nonce: config.csp.nonce,
    cssLayer: config.cssLayer,
    overlayTarget: () => overlayTarget.value,
    zIndex: config.zIndex.modal,
    slots: { content: slots.content ? slotNode : undefined },
    on: {
        start: (index) => emit('start', index),
        'step-change': (context) => {
            step.value = context.index;
            emit('step-change', context);
            props.options?.on?.['step-change']?.(context);
        },
        end: (context) => {
            open.value = false;
            // A tour that ended starts again from the top; `storageKey` is what resumes one.
            step.value = undefined;
            emit('end', context);
            props.options?.on?.end?.(context);
        }
    }
});

onMounted(() => {
    tour = createTour(inputs());
    if (open.value) void tour.drive(step.value);
});

watch(open, (value) => {
    if (!tour) return;
    if (value && !tour.isActive()) void tour.drive(step.value);
    else if (!value && tour.isActive()) tour.destroy();
});

watch(step, (value) => {
    if (tour?.isActive() && value !== undefined && value !== tour.getActiveIndex()) void tour.moveTo(value);
});

watch(
    () => [props, config.locale, config.unstyled, config.pt.tour, config.tour] as const,
    () => tour?.update(inputs()),
    { deep: true }
);

onBeforeUnmount(() => {
    tour?.destroy();
    tour = null;
    if (container) render(null, container);
});

defineExpose({
    drive: (at?: number | string) => tour?.drive(at),
    moveNext: () => tour?.moveNext(),
    movePrevious: () => tour?.movePrevious(),
    moveTo: (at: number | string) => tour?.moveTo(at),
    highlight: (s: Parameters<TourHandle['highlight']>[0]) => tour?.highlight(s),
    refresh: () => tour?.refresh(),
    destroy: () => tour?.destroy(),
    reset: () => tour?.reset(),
    isCompleted: () => tour?.isCompleted() ?? false,
    /** The framework-free tour underneath, for anything this component does not expose. */
    tour: () => tour
});
</script>

<template>
    <!-- The tour draws itself over the page, in the overlay host: nothing is rendered here. -->
    <template v-if="false" />
</template>
