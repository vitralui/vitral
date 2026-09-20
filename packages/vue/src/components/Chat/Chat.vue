<script setup lang="ts">
import { createChat, type ChatAttachment, type ChatConfig, type ChatHandle, type ChatMessage } from '@vitral/chat';
import { mergeAttrs, type PassThrough, type PassThroughContext as DomPassThroughContext } from '@vitral/dom';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import {
    defineComponent,
    getCurrentInstance,
    h,
    normalizeClass,
    normalizeStyle,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    render,
    shallowRef,
    toRaw,
    useAttrs,
    useId,
    watch,
    type ComponentInternalInstance,
    type Slots
} from 'vue';
import { collectParts, contentOf } from '../../base/parts';
import type { PassThroughAttrs, PassThroughContext, PassThroughValue } from '../../base/types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { useVitral } from '../../config/config';
import type { ChatEmits, ChatProps, ChatSlots } from './types';

// The thread is `@vitral/chat`'s framework-free renderer; this component only
// hands it the props, the Vitral configuration (locale, unstyled, pass-through,
// the theme) and the slots, and turns its events into emits. What is drawn —
// the runs, the streaming caret, the roving focus, the composer — is the
// addon's, and the same conversation can be drawn by React, by Angular or by a
// page with no framework at all.

defineOptions({ name: 'VtChat', inheritAttrs: false });

const props = withDefaults(defineProps<ChatProps>(), {
    unstyled: undefined,
    messages: () => [],
    variant: 'basic',
    // Absent, not false: an unset boolean prop is `false` to Vue, and this one
    // defaults to true — left as false it would turn Enter off for everyone.
    sendOnEnter: undefined
});
const draft = defineModel<string>('draft', { default: '' });
const attachments = defineModel<ChatAttachment[]>('attachments', { default: () => [] });
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<ChatEmits>();
const slots = defineSlots<ChatSlots>();

const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget();
const attrs = useAttrs();
const id = useId();
const instance = getCurrentInstance()!;
const host = shallowRef<HTMLElement | null>(null);
let chat: ChatHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- slots: each is rendered by Vue into a container of its own, which the chat places

// Slot content keeps what it would inject where the chat is (a theme scope, an overlay host).
const SlotHost = defineComponent({
    name: 'VtChatSlot',
    props: { draw: { type: Function, required: true } },
    setup(p) {
        const self = getCurrentInstance() as ComponentInternalInstance & { provides: object };
        self.provides = (instance as ComponentInternalInstance & { provides: object }).provides;
        return () => (p.draw as () => unknown)();
    }
});

const containers = new Map<string, HTMLElement>();
function node(key: string, draw: () => unknown): Node {
    let el = containers.get(key);
    if (!el) {
        el = document.createElement('div');
        el.style.display = 'contents';
        containers.set(key, el);
    }
    const vnode = h(SlotHost, { draw });
    vnode.appContext = instance.appContext;
    render(vnode, el);
    return el;
}

/** Containers whose message the chat no longer draws are torn down with it. */
function sweep() {
    for (const [key, el] of containers) {
        if (el.isConnected) continue;
        render(null, el);
        containers.delete(key);
    }
}

const parts = shallowRef<Map<string, Slots>>(new Map());
/** Read while this component renders, so what the parts read is tracked like anything else. */
function readParts(): undefined {
    const found = new Map<string, Slots>();
    collectParts(slots.default?.(), found);
    parts.value = found;
    return undefined;
}

const contentFor = (slot: string, part: string) => contentOf(slots as Slots, slot, parts.value, part);

const slotContent = (): ChatConfig['slots'] => {
    const header = contentFor('header', 'Header');
    const footer = contentFor('footer', 'Footer');
    const empty = contentFor('empty', 'Empty');
    const launcher = contentFor('launcher', 'Launcher');
    const message = slots.message;
    return {
        header: header && (() => node('header', () => header())),
        footer: footer && (() => node('footer', () => footer())),
        empty: empty && (() => node('empty', () => empty())),
        launcher: launcher && ((context: { open: boolean }) => node('launcher', () => launcher(context))),
        message: message && ((context: { message: ChatMessage; index: number }) => node(`message:${context.message.id}`, () => message(context)))
    };
};

// ---- pass-through: the root takes class, style, design tokens and the rest of the attributes

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

function passThrough(part: string, context: DomPassThroughContext): PassThroughAttrs | undefined {
    const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
    const global = config.pt.chat?.[part];
    const local = props.pt?.[part];
    let own: PassThroughAttrs | undefined;
    // The widget wears its shell on the host, so the attributes follow whichever is the root.
    const rootPart = props.variant === 'widget' ? 'widget' : 'root';
    if (part === rootPart) {
        own = { ...attrs };
        if (props.dt) own = mergeAttrs(vueAttrs(own), { style: flattenTokens(props.dt as TokenTree, [], theme?.options.prefix) });
    }
    if (!own && !global && !local) return undefined;
    return mergeAttrs(vueAttrs(own ?? {}), vueAttrs(resolve(global, ctx)), vueAttrs(resolve(local, ctx)));
}

function passThroughMap(): PassThrough {
    const names = new Set(['root', 'widget', ...Object.keys(config.pt.chat ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...names].map((part) => [part, (context: DomPassThroughContext) => passThrough(part, context)]));
}

// ---- the chat -----------------------------------------------------------------------

const inputs = (): ChatConfig => ({
    messages: toRaw(props.messages),
    draft: draft.value,
    attachments: toRaw(attachments.value),
    open: open.value,
    variant: props.variant,
    ariaLabel: attrs['aria-label'] as string | undefined,
    placeholder: props.placeholder,
    suggestions: toRaw(props.suggestions),
    emptyMessage: props.emptyMessage,
    typing: props.typing,
    disabled: props.disabled,
    readonly: props.readonly,
    allowAttachments: props.allowAttachments,
    accept: props.accept,
    maxRows: props.maxRows,
    sendOnEnter: props.sendOnEnter,
    height: props.height,
    locale: config.locale,
    unstyled: unstyled(),
    pt: passThroughMap(),
    slots: slotContent()
});

const events: ChatConfig['on'] = {
    send: (payload) => emit('send', payload),
    'draft-change': (text) => (draft.value = text),
    retry: (message) => emit('retry', message),
    suggestion: (text) => emit('suggestion', text),
    attach: (files) => emit('attach', files),
    detach: (_attachment, index) => (attachments.value = attachments.value.filter((_, i) => i !== index)),
    'open-change': (value) => {
        open.value = value;
        emit('open-change', value);
    },
    'at-bottom-change': (value) => emit('at-bottom-change', value)
};

onMounted(() => {
    chat = createChat(host.value!, {
        ...inputs(),
        id,
        nonce: config.csp.nonce,
        cssLayer: config.cssLayer,
        // The widget's panel hangs outside the page, so it needs the same
        // overlay scope every other Vitral panel uses.
        overlayTarget: () => overlayTarget.value,
        zIndex: config.zIndex.overlay,
        on: events
    });
    sweep();
});

function push(next: Partial<ChatConfig>) {
    if (!chat) return;
    chat.update(next);
    sweep();
}

// Deep, over the reactive props (not their raw objects), so a message changed in place is seen too.
watch(
    () => [props.messages, props.suggestions, attachments.value],
    () => push(inputs()),
    { deep: true }
);
watch(
    () => [draft.value, open.value, props.variant, props.typing, props.disabled, props.readonly, props.allowAttachments, props.accept, props.maxRows, props.sendOnEnter, props.height, props.placeholder, props.emptyMessage],
    () => push(inputs())
);
watch(
    () => [config.locale, unstyled(), props.pt, props.dt, config.pt.chat, config.zIndex.overlay] as const,
    () => push({ locale: config.locale, unstyled: unstyled(), pt: passThroughMap(), zIndex: config.zIndex.overlay }),
    { deep: true }
);

// A slot added or removed, and the attributes the wrapper wears, are read
// through functions: draw again when the component that holds them re-rendered.
onUpdated(() => {
    if (!chat) return;
    chat.update({ pt: passThroughMap(), slots: slotContent() });
    sweep();
});

onBeforeUnmount(() => {
    chat?.destroy();
    chat = null;
    containers.forEach((el) => render(null, el));
    containers.clear();
});

defineExpose({
    focus: () => chat?.focus(),
    scrollToBottom: (smooth?: boolean) => chat?.scrollToBottom(smooth),
    atBottom: () => chat?.atBottom() ?? true,
    /** The framework-free chat underneath, for anything this component does not expose. */
    chat: () => chat
});
</script>

<template>
    <div ref="host" :data-vt-parts="readParts()" />
</template>
