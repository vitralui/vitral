<script setup lang="ts">
import {
    ariaEditorShortcut,
    createEditor,
    editorPalette,
    editorKeyName,
    editorShortcutFor,
    endOfEditorDoc,
    formatEditorShortcut,
    isMacPlatform,
    type EditorCommandArgs,
    type EditorCommandName,
    type EditorContent,
    type EditorKeyBinding,
    type EditorNode,
    type EditorView
} from '@vitral/core';
import {
    createBlockHandle,
    createChipMenu,
    createFindBar,
    createMathTools,
    createSlashMenu,
    defaultBlockActions,
    defaultMathTemplates,
    defaultSlashCommands,
    type BlockHandle,
    type ChipMenu,
    type CommandRunner,
    type MathTools,
    type SlashMenu
} from '@vitral/editor';
import { editorStyle, scrollpanelStyle } from '@vitral/styles';
import { computed, getCurrentInstance, mergeProps, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, toRaw, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { EditorKey, type EditorContext } from './context';
import EditorLinkPanel from './EditorLinkPanel.vue';
import type { EditorJSON, EditorRootEmits, EditorRootProps, EditorSelectionChangeEvent } from './types';

// The part that owns the editor: the model (HTML, and JSON when it is bound),
// the framework-free editor and view, and everything the other parts share.
// It draws the field around them; the parts it holds decide what is inside.

defineOptions({ name: 'VtEditorRoot', inheritAttrs: false });

const props = withDefaults(defineProps<EditorRootProps>(), {
    unstyled: undefined,
    variant: undefined,
    readonly: false,
    disabled: false,
    invalid: false,
    autofocus: false,
    // A boolean prop that is not given arrives as `false`, and both of these
    // are on unless they are turned off.
    slashMenu: true,
    blockMenu: true,
    math: true,
    find: true
});
const model = defineModel<string | null>();
const json = defineModel<EditorJSON | null>('json');
const emit = defineEmits<EditorRootEmits>();

const { part, config, locale } = useComponent(editorStyle, props);
// The ScrollPanel's bars on the menus' lists, as on every box that scrolls.
const barOptions = () => ({
    mode: props.scrollbar ?? config.scrollbar,
    style: scrollpanelStyle,
    unstyled: props.unstyled ?? config.unstyled,
    nonce: config.csp.nonce,
    cssLayer: config.cssLayer
});
const overlayTarget = useOverlayTarget();
const { rootAttrs, controlAttrs } = useSplitAttrs();
const instance = getCurrentInstance();
const uid = useId();

const listens = (event: string) => !!instance?.vnode.props?.[event];

const editor = createEditor({
    content: (model.value || json.value || '') as EditorContent,
    maxLength: props.maxLength ?? null,
    historyDelay: props.historyDelay,
    mathOutput: typeof props.math === 'object' && props.math ? props.math.output : undefined
});
const state = shallowRef(editor.state);
const view = shallowRef<EditorView | null>(null);
const rootRef = ref<HTMLElement | null>(null);
const caretRef = ref<HTMLElement | null>(null);
const contentEl = ref<HTMLElement | null>(null);
const toolbar = ref<HTMLElement | null>(null);
const bubble = ref<HTMLElement | null>(null);
const contentFocused = ref(false);
const selecting = ref(false);
const bubbleDismissed = ref(false);
const popups = ref(0);
const describedBy = ref<string[]>([]);
let lastHTML = editor.getHTML();
let lastJSON: unknown = json.value;
let syncing = false;
let openLinkPanel: ((anchor: HTMLElement | null) => void) | null = null;

const editable = computed(() => !props.readonly && !props.disabled);

const mathOptions = computed(() => (typeof props.math === 'object' && props.math ? props.math : {}));
const mathEnabled = computed(() => props.math !== false && editable.value);
const mathEdit = computed(() => (mathEnabled.value ? (mathOptions.value.inlineEdit === false ? 'panel' : 'inline') : undefined));
watch(
    () => mathOptions.value.output,
    (output) => (editor.mathOutput = output ?? 'drawing')
);

// Find and replace: the framework-free bar, drawn by an <EditorFind> part.
let findRender: (() => void) | null = null;
const findBar = createFindBar({
    editor,
    view: () => view.value,
    part,
    locale: () => locale.value,
    editable: () => editable.value,
    render: () => findRender?.(),
    id: `${uid}-find`
});

function onFindKey(event: KeyboardEvent) {
    if (!findRender || props.find === false) return;
    const name = editorKeyName(event);
    const replace = name === (isMacPlatform() ? 'Mod-Alt-f' : 'Mod-h');
    if (name !== 'Mod-f' && !replace) return;
    event.preventDefault();
    findBar.open({ replace });
}

function emitContent(source: 'user' | 'api' | 'history') {
    const html = editor.getHTML();
    lastHTML = html;
    model.value = html;
    if (listens('onUpdate:json')) {
        const value = editor.getJSON() as EditorJSON;
        lastJSON = value;
        json.value = value;
    }
    emit('text-change', { htmlValue: html, textValue: editor.getText(), source });
}

const stop = editor.subscribe((update) => {
    state.value = update.state;
    if (update.selectionChanged) bubbleDismissed.value = false;
    if (update.docChanged && !syncing) emitContent(update.origin);
    if (update.docChanged) findBar.sync();
    if (update.selectionChanged) {
        const selection: EditorSelectionChangeEvent['selection'] = update.state.selection;
        const { anchor, head } = selection;
        emit('selection-change', { selection, empty: anchor.offset === head.offset && anchor.path.join() === head.path.join(), source: update.origin });
    }
});
onBeforeUnmount(stop);

function setContent(value: EditorContent) {
    syncing = true;
    try {
        editor.setContent(value, { keepSelection: true });
    } finally {
        syncing = false;
    }
}

watch(model, (value) => {
    if ((value ?? '') === lastHTML) return;
    setContent(value ?? '');
    // The model keeps what it was given; the document is what could be read from it.
    lastHTML = value ?? '';
    if (listens('onUpdate:json')) {
        lastJSON = editor.getJSON();
        json.value = lastJSON as EditorJSON;
    }
});

watch(json, (value) => {
    if (value == null || toRaw(value) === toRaw(lastJSON)) return;
    lastJSON = toRaw(value);
    setContent(toRaw(value) as EditorNode);
    lastHTML = editor.getHTML();
    model.value = lastHTML;
});

watch(
    () => props.maxLength,
    (value) => (editor.maxLength = value ?? null)
);

watch(editable, () => view.value?.update());

const colors = computed(() => {
    if (!props.colors) return editorPalette;
    const wanted = props.colors;
    return wanted.map((name) => editorPalette.find((c) => c.name === name)).filter((c): c is (typeof editorPalette)[number] => !!c);
});

const contentAttrs = computed(() => controlAttrs.value as Record<string, unknown>);
const contentId = computed(() => (controlAttrs.value.id as string | undefined) ?? `${uid}-content`);
const ids = {
    get content() {
        return contentId.value;
    },
    help: `${uid}-help`
};

function focus() {
    const v = view.value;
    if (!v || props.disabled) return;
    v.focus();
}

function focusFirst(container: HTMLElement | null): boolean {
    if (!container) return false;
    const buttons = Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'));
    const target = buttons.find((b) => b.tabIndex === 0) ?? buttons[0];
    if (!target) return false;
    target.focus();
    return true;
}

function caretAnchor(): HTMLElement | null {
    const caret = caretRef.value;
    const root = rootRef.value;
    const rect = view.value?.selectionRect();
    if (!caret || !root) return null;
    if (rect) {
        const box = root.getBoundingClientRect();
        caret.style.left = `${rect.left - box.left}px`;
        caret.style.top = `${rect.top - box.top}px`;
        caret.style.width = `${Math.max(1, rect.width)}px`;
        caret.style.height = `${Math.max(1, rect.height)}px`;
    }
    return caret;
}

function run<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean {
    return editor.run(name, ...args);
}

const ctx: EditorContext = {
    editor,
    state,
    view,
    editable,
    readonly: computed(() => props.readonly),
    disabled: computed(() => props.disabled),
    invalid: computed(() => props.invalid),
    placeholder: computed(() => props.placeholder),
    maxLength: computed(() => props.maxLength),
    colors,
    locale,
    ids,
    describedBy,
    contentAttrs,
    contentFocused,
    toolbar,
    bubble,
    selecting,
    bubbleDismissed,
    popups,
    unstyled: () => props.unstyled,
    scrollbar: () => props.scrollbar,
    pt: () => props.pt,
    isActive(name, attrs) {
        void state.value;
        return editor.isActive(name, attrs);
    },
    can(name, ...args) {
        void state.value;
        return editable.value && editor.can(name, ...args);
    },
    run,
    focus,
    focusToolbar() {
        return focusFirst(toolbar.value) || focusFirst(bubble.value);
    },
    openLink(anchor) {
        if (!editable.value) return;
        openLinkPanel?.(anchor ?? caretAnchor());
    },
    caretAnchor,
    shortcut(command, args = []) {
        const key = editorShortcutFor(command, args);
        return key ? { label: formatEditorShortcut(key), aria: ariaEditorShortcut(key) } : undefined;
    },
    attachView(next, element) {
        view.value = next;
        contentEl.value = element ?? null;
    },
    handleKey(name: string, binding: EditorKeyBinding | undefined, event: KeyboardEvent) {
        const command = binding?.[0];
        if (command === 'link') {
            ctx.openLink();
            return true;
        }
        if (command === 'toolbar') return ctx.focusToolbar();
        if (name === 'Escape' && bubble.value && !bubbleDismissed.value) {
            bubbleDismissed.value = true;
            return true;
        }
        void event;
        return false;
    },
    onContentFocus(event) {
        contentFocused.value = true;
        emit('focus', event);
    },
    onContentBlur(event) {
        contentFocused.value = false;
        emit('blur', event);
    },
    registerLinkPanel(open) {
        openLinkPanel = open;
    },
    math: {
        on: computed(() => props.math !== false),
        enabled: mathEnabled,
        edit: mathEdit,
        open: (anchor) => mathTools?.open(anchor)
    },
    find: findBar,
    registerFind(render) {
        findRender = render;
        if (!render) findBar.close({ focusEditor: false });
    }
};

provide(EditorKey, ctx);

const rootState = computed(() => ({
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly
}));

// A press on the frame (not on a control) puts the caret in the text, as it does in a native text box.
function onRootMousedown(event: MouseEvent) {
    if (event.target !== rootRef.value) return;
    event.preventDefault();
    focus();
}

function onDocumentPointerUp() {
    selecting.value = false;
}

/**
 * The menu a `/` opens and the handle beside a block are `@vitral/editor`'s,
 * attached to this editor: the same two pieces the framework-free editor uses,
 * so neither is written twice.
 */
let slash: SlashMenu | null = null;
let chipMenu: ChipMenu | null = null;
let mathTools: MathTools | null = null;
let blockHandle: BlockHandle | null = null;

function attachMenus() {
    slash?.destroy();
    chipMenu?.destroy();
    chipMenu = createChipMenu({
        editor,
        content: () => contentEl.value,
        anchor: caretAnchor,
        triggers: () => (props.chips ? (Array.isArray(props.chips) ? props.chips : [props.chips]) : []),
        part,
        locale: () => locale.value,
        enabled: () => !!props.chips && editable.value,
        place: () => void caretAnchor(),
        id: `${uid}-chips`,
        overlayTarget: overlayTarget.value,
        zIndex: config.zIndex.overlay
    });
    mathTools?.destroy();
    mathTools = createMathTools({
        editor,
        view: () => view.value,
        content: () => contentEl.value,
        anchor: caretAnchor,
        place: () => void caretAnchor(),
        templates: () => mathOptions.value.templates ?? defaultMathTemplates(locale.value),
        inlineEdit: () => mathOptions.value.inlineEdit !== false,
        part,
        locale: () => locale.value,
        enabled: () => mathEnabled.value,
        focus,
        id: `${uid}-math`,
        overlayTarget: overlayTarget.value,
        zIndex: config.zIndex.overlay,
        scrollbars: barOptions
    });
    blockHandle?.destroy();
    slash = createSlashMenu({
        editor,
        content: () => contentEl.value,
        anchor: caretAnchor,
        // The formula entry is there only where formulas are.
        commands: () => (Array.isArray(props.slashMenu) ? props.slashMenu : defaultSlashCommands(locale.value).filter((command) => command.id !== 'math' || props.math !== false)),
        part,
        locale: () => locale.value,
        enabled: () => props.slashMenu !== false && editable.value,
        place: () => void caretAnchor(),
        overlayTarget: overlayTarget.value,
        zIndex: config.zIndex.overlay,
        scrollbars: barOptions,
        onRun: (command) => {
            // The formula panel is not a command of the document's: it opens here, where the caret was left.
            if (command.command?.[0] === 'math') mathTools?.open();
            else if (command.run) command.run(editor as unknown as CommandRunner);
            else if (command.command) (editor.run as (name: string, ...args: unknown[]) => boolean)(command.command[0], ...command.command.slice(1));
        }
    });
    blockHandle = createBlockHandle({
        editor,
        host: () => rootRef.value,
        caretRect: () => view.value?.selectionRect() ?? null,
        content: () => contentEl.value ?? null,
        actions: () => (Array.isArray(props.blockMenu) ? props.blockMenu : defaultBlockActions(locale.value)),
        part,
        locale: () => locale.value,
        enabled: () => props.blockMenu !== false && editable.value,
        overlayTarget: overlayTarget.value,
        zIndex: config.zIndex.overlay
    });
}

watch([() => props.slashMenu, () => props.blockMenu, () => props.chips, contentEl], attachMenus, { flush: 'post' });
// Formulas switched off, or the text made read-only, with the panel open: it goes.
watch(mathEnabled, (on) => !on && mathTools?.close());

onMounted(() => {
    attachMenus();
    document.addEventListener('pointerup', onDocumentPointerUp);
    document.addEventListener('mouseup', onDocumentPointerUp);
    emit('load', { instance: editor });
    if (props.autofocus) {
        nextTick(() => {
            const end = endOfEditorDoc(editor.state.doc);
            editor.setSelection({ anchor: end, head: end });
            focus();
        });
    }
});

onBeforeUnmount(() => {
    slash?.destroy();
    chipMenu?.destroy();
    mathTools?.destroy();
    blockHandle?.destroy();
    findBar.destroy();
    document.removeEventListener('pointerup', onDocumentPointerUp);
    document.removeEventListener('mouseup', onDocumentPointerUp);
});

defineExpose({
    /** The framework-free editor. */
    editor,
    commands: editor.commands,
    focus,
    blur: () => contentEl.value?.blur(),
    /** The document as HTML; `{ math: 'drawing' | 'source' }` says how formulas are written in this one. */
    getHTML: (options?: { math?: 'drawing' | 'source' }) => editor.getHTML(options),
    getJSON: () => editor.getJSON(),
    getText: () => editor.getText(),
    getMarkdown: () => editor.getMarkdown(),
    setContent: (value: EditorContent) => {
        editor.setContent(value);
    },
    can: ctx.can,
    isActive: ctx.isActive,
    run,
    /** Opens the find bar, with the replace row and a query when given. */
    openFind: (options?: { replace?: boolean; query?: string }) => findBar.open(options),
    closeFind: () => findBar.close({ focusEditor: false })
});
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', rootState))" @mousedown="onRootMousedown" @keydown="onFindKey">
        <slot />
        <span :id="ids.help" v-bind="part('instructions')">{{ locale.editor.keyboardHelp }}</span>
        <div ref="caretRef" aria-hidden="true" v-bind="part('caret')" />
        <EditorLinkPanel />
    </div>
</template>
