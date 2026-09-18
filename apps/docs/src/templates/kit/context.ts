import { computed, inject, onBeforeUnmount, onMounted, provide, ref, type InjectionKey, type Ref } from 'vue';
import type { TemplateScreen } from '../types';

/**
 * A template navigates itself: its screens switch through this context rather
 * than through the site's router, so the same template runs inside a preview
 * frame, full screen, or copied into an application of its own.
 */
export interface TemplateContext {
    screen: Ref<string>;
    screens: TemplateScreen[];
    standalone: () => boolean;
    /** Whether the template is laid out at phone width; the shell keeps it current. */
    narrow: Ref<boolean>;
    go: (id: string) => void;
}

const key: InjectionKey<TemplateContext> = Symbol('template');

export function provideTemplate(screen: Ref<string>, screens: TemplateScreen[], standalone: () => boolean) {
    const context: TemplateContext = {
        screen,
        screens,
        standalone,
        narrow: ref(false),
        go: (id) => {
            screen.value = id;
        }
    };
    provide(key, context);
    return {
        ...context,
        current: computed(() => screens.find((entry) => entry.id === screen.value) ?? screens[0]!)
    };
}

export function useTemplate() {
    const context = inject(key);
    if (!context) throw new Error('useTemplate() needs a template layout above it.');
    return context;
}

/**
 * Whether an element is narrower than `width`. Media queries answer for the
 * window, and a template in a phone-sized frame lives in a wide window, so
 * the components that switch behaviour, not just layout, ask the element.
 */
export function useNarrow(target: Ref<HTMLElement | null>, width = 720) {
    const narrow = ref(false);
    let observer: ResizeObserver | null = null;
    onMounted(() => {
        if (!target.value || typeof ResizeObserver === 'undefined') return;
        observer = new ResizeObserver(([entry]) => (narrow.value = (entry?.contentRect.width ?? width) < width));
        observer.observe(target.value);
    });
    onBeforeUnmount(() => observer?.disconnect());
    return narrow;
}

/** Brings a template back to its top when the screen changes. */
export function scrollTemplateTop(root: HTMLElement | null, standalone: boolean) {
    const viewport = root?.closest<HTMLElement>('[data-template-viewport]');
    if (viewport) viewport.scrollTop = 0;
    else if (standalone) document.documentElement.scrollTop = 0;
}
