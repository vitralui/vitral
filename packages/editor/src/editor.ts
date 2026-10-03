import {
    activeEditorBlockType,
    activeEditorMark,
    ariaEditorShortcut,
    createEditor as createEditorInstance,
    createEditorView,
    editorLinkAt,
    editorKeyName,
    editorLinkHint,
    editorPalette,
    editorShortcutFor,
    editorSelectionRange,
    editorTextblocks,
    en,
    formatEditorShortcut,
    followEditorLink,
    formatMessage,
    isEmptyEditorDoc,
    isMacPlatform,
    loadStyle,
    matchEditorPaletteColor,
    visuallyHidden,
    type EditorColor,
    type EditorInstance,
    type EditorNode,
    type EditorView,
    type Locale
} from '@vitral/core';
import { createOverlay, createSelect, createTooltips, type Overlay, type SelectHandle } from '@vitral/controls';
import { createRoot, h, mergeAttrs, partResolver, scrollbarSet, type Child, type Props } from '@vitral/dom';
import { registerIcons } from '@vitral/icons';
import { baseStyle, buttonStyle, editorStyle, scrollpanelStyle } from '@vitral/styles';
import { defaultBubbleMenu, defaultToolbar, editorIcons } from './buttons';
import { createBlockHandle, defaultBlockActions } from './block';
import { colorPanelView, imagePanelView, linkPanelView, tablePanelView, type LinkPanelState, type PanelContext } from './render/menus';
import { createChipMenu } from './chips';
import { createMathTools, defaultMathTemplates } from './math';
import { createFindBar } from './find';
import { createSlashMenu, defaultSlashCommands } from './slash';
import { bubbleView, toolbarView, type ToolbarContext } from './render/toolbar';
import type { TextEditorConfig, TextEditorHandle, EditorToolbarItem } from './types';

/**
 * A rich text editor with no framework in it: the document, the commands and
 * the history are `@vitral/core`'s, the text itself is its view over a
 * `contenteditable` element, and everything around them — the toolbar, the
 * panels, the floating toolbar over a selection, the menu a `/` opens and the
 * handle beside a block — is drawn here.
 */

let counter = 0;

export function createTextEditor(element: HTMLElement, config: TextEditorConfig = {}): TextEditorHandle {
    let current: TextEditorConfig = { ...config };
    let view: EditorView | null = null;
    let contentEl: HTMLElement | null = null;
    let caretEl: HTMLElement | null = null;
    let blockSelect: SelectHandle | null = null;
    let blockSelectHost: HTMLElement | null = null;
    let link: LinkPanelState = { href: '', text: '', newTab: false, existing: false };
    const anchors = new Map<string, HTMLElement>();

    const id = config.id ?? `vt-texteditor-${++counter}`;
    const ids = { content: `${id}-content`, help: `${id}-help`, slash: `${id}-slash`, block: `${id}-block` };
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const palette = (): readonly EditorColor[] => current.palette ?? editorPalette;
    const part = partResolver({
        style: editorStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(buttonStyle.name, buttonStyle.css, options);
        loadStyle(editorStyle.name, editorStyle.css, options);
    }
    // The ScrollPanel's bars on the text area, so one theme dresses every bar.
    const barOptions = () => ({ mode: current.scrollbar, arrows: current.scrollbarArrows, style: scrollpanelStyle, unstyled: current.unstyled, nonce: current.nonce, cssLayer: current.cssLayer });
    const bars = scrollbarSet(barOptions);
    // The toolbar holds its own definitions, but the slash menu, the block
    // handle and any command an application names its own icon for are looked
    // up by name: the editor puts its set in the registry rather than drawing
    // a bar of empty buttons in an application that never registered them.
    // What each button is, shown the way every other Vitral control shows it.
    const tooltips = createTooltips(() => ({
        placement: 'bottom',
        unstyled: current.unstyled,
        nonce: current.nonce,
        cssLayer: current.cssLayer,
        zIndex: current.zIndex,
        pt: current.pt
    }));

    registerIcons(editorIcons);

    const editor: EditorInstance = createEditorInstance({
        content: current.content ?? '',
        maxLength: current.maxLength ?? null,
        historyDelay: current.historyDelay,
        mathOutput: typeof current.math === 'object' ? current.math.output : undefined
    });

    const editable = () => !current.readonly && !current.disabled;
    const collapsed = () => editorSelectionRange(editor.state.selection).empty;
    const run = (name: string, ...args: unknown[]) => (editor.run as (n: string, ...a: unknown[]) => boolean)(name, ...args);
    const can = (name: string, ...args: unknown[]) => (editor.can as (n: string, ...a: unknown[]) => boolean)(name, ...args);

    // ---- what the outside hears ---------------------------------------------------------

    const stop = editor.subscribe((update) => {
        if (update.docChanged) {
            current.on?.change?.({ html: editor.getHTML(), json: editor.getJSON(), text: editor.getText() });
        }
        if (update.docChanged) findBar.sync();
        if (update.selectionChanged) {
            current.on?.['selection-change']?.({ empty: collapsed(), source: update.origin === 'user' ? 'user' : update.origin === 'history' ? 'history' : 'api' });
        }
        render();
    });

    // ---- the panels ------------------------------------------------------------------------

    const panelContext = (): PanelContext => ({ locale: locale(), part, ids });

    const anchorFor = (name: string) => () => anchors.get(name) ?? caretEl;

    function panel(name: string, render: () => ReturnType<typeof linkPanelView> | null, placement: 'bottom-start' | 'bottom-end' = 'bottom-start'): Overlay {
        return createOverlay({
            anchor: anchorFor(name),
            render,
            placement,
            target: () => current.overlayTarget,
            zIndex: current.zIndex,
            onClose: () => renderPanels()
        });
    }

    const linkPanel = panel('link', () => linkPanelView(panelContext(), link, linkActions));
    const imagePanel = panel('image', () => imagePanelView(panelContext(), imageActions));
    const tablePanel = panel('table', () => tablePanelView(panelContext(), { insert: insertTable }));
    const colorPanel = panel('color', () => colorPanelView(panelContext(), { kind: colorKind, palette: palette(), chosen: colorOf(colorKind), onChoose: chooseColor }));
    let colorKind: 'color' | 'highlight' = 'color';

    const linkActions = {
        change: (patch: Partial<LinkPanelState>) => {
            link = { ...link, ...patch, error: undefined };
            linkPanel.update();
        },
        apply: () => {
            const href = link.href.trim();
            if (!href) {
                link = { ...link, error: locale().editor.invalidUrl };
                linkPanel.update();
                return;
            }
            run('setLink', href, { target: link.newTab ? '_blank' : null, text: link.text.trim() || undefined });
            linkPanel.close();
            focus();
        },
        remove: () => {
            run('unsetLink');
            linkPanel.close();
            focus();
        },
        open: () => {
            followEditorLink(link.href.trim());
            linkPanel.close();
        },
        cancel: () => {
            linkPanel.close();
            focus();
        }
    };

    /** The link editor, filled in with the link under the caret when there is one. */
    function openLinkPanel(event?: MouseEvent) {
        if (!editable()) return;
        const at = editorLinkAt(editor.state);
        link = { href: at?.href ?? '', text: at?.text ?? '', newTab: at?.target === '_blank', existing: !!at };
        if (!event) placeCaret();
        openPanel(linkPanel, 'link', event);
    }

    const imageActions = {
        insert: (src: string, alt: string) => {
            if (src.trim()) run('insertImage', { src: src.trim(), alt: alt.trim() });
            imagePanel.close();
            focus();
        },
        cancel: () => {
            imagePanel.close();
            focus();
        }
    };

    function insertTable(rows: number, columns: number) {
        run('insertTable', rows, columns, true);
        tablePanel.close();
        focus();
    }

    const colorOf = (kind: 'color' | 'highlight'): EditorColor | undefined => {
        const mark = activeEditorMark(editor.state, kind);
        const value = mark?.attrs?.color;
        if (typeof value !== 'string') return undefined;
        const name = matchEditorPaletteColor(value, kind, palette());
        return palette().find((color) => color.name === name);
    };

    function chooseColor(color: EditorColor | null) {
        run(colorKind === 'color' ? 'setColor' : 'setHighlight', color?.name ?? null);
        colorPanel.close();
        focus();
    }

    // ---- the floating toolbar over a selection -----------------------------------------------

    const bubble = createOverlay({
        anchor: () => caretEl,
        render: () => bubbleView(toolbarContext(), bubbleItems()) as never,
        placement: 'top',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        restoreFocus: false
    });

    const bubbleItems = (): EditorToolbarItem[] => (Array.isArray(current.bubbleMenu) ? current.bubbleMenu : defaultBubbleMenu);

    function syncBubble() {
        const wanted = current.bubbleMenu !== false && editable() && !collapsed() && !editor.isEmpty();
        if (wanted) {
            placeCaret();
            bubble.open();
            bubble.update();
        } else bubble.close();
    }

    // ---- the menu a slash opens, and the handle beside a block ---------------------------------

    const chipMenu = createChipMenu({
        editor,
        content: () => contentEl,
        anchor: () => caretEl,
        triggers: () => (current.chips ? (Array.isArray(current.chips) ? current.chips : [current.chips]) : []),
        part,
        locale,
        enabled: () => !!current.chips && editable(),
        place: placeCaret,
        id: `${ids.slash}-chips`,
        overlayTarget: current.overlayTarget,
        zIndex: current.zIndex
    });

    // ---- formulas ---------------------------------------------------------------------------------

    const mathOn = () => current.math !== false;
    const mathOptions = () => (typeof current.math === 'object' ? current.math : {});
    const mathTools = createMathTools({
        editor,
        view: () => view,
        content: () => contentEl,
        anchor: () => caretEl,
        place: placeCaret,
        templates: () => mathOptions().templates ?? defaultMathTemplates(locale()),
        inlineEdit: () => mathOptions().inlineEdit !== false,
        part,
        locale,
        enabled: () => mathOn() && editable(),
        focus: () => view?.focus(),
        id: `${id}-math`,
        overlayTarget: current.overlayTarget,
        zIndex: current.zIndex,
        scrollbars: barOptions
    });

    const slashMenu = createSlashMenu({
        editor,
        content: () => contentEl,
        anchor: () => caretEl,
        commands: () => (Array.isArray(current.slashMenu) ? current.slashMenu : defaultSlashCommands(locale()).filter((command) => command.id !== 'math' || mathOn())),
        part,
        locale,
        enabled: () => current.slashMenu !== false && editable(),
        place: placeCaret,
        ids,
        overlayTarget: current.overlayTarget,
        zIndex: current.zIndex,
        scrollbars: barOptions,
        onRun: (command) => {
            if (command.run) command.run(handle);
            // The formula panel takes the keyboard itself: it opens where the caret was left.
            else if (command.command?.[0] === 'math') return mathTools.open();
            else if (command.command) run(command.command[0], ...command.command.slice(1));
            focus();
        }
    });

    const blockHandle = createBlockHandle({
        editor,
        host: () => element,
        caretRect: () => view?.selectionRect() ?? null,
        content: () => contentEl,
        actions: () => (Array.isArray(current.blockMenu) ? current.blockMenu : defaultBlockActions(locale())),
        part,
        locale,
        enabled: () => current.blockMenu !== false && editable(),
        ids,
        overlayTarget: current.overlayTarget,
        zIndex: current.zIndex
    });

    // ---- find and replace ---------------------------------------------------------------------

    const findBar = createFindBar({
        editor,
        view: () => view,
        part,
        locale,
        editable,
        render: () => render(),
        id: `${id}-find`
    });

    // Ctrl/⌘+F finds and Ctrl+H (⌘+⌥+F on a Mac, where ⌘+H hides the app)
    // replaces, anywhere in the editor — the text, the toolbar or the bar.
    const onFindKey = (event: KeyboardEvent) => {
        if (current.find === false) return;
        const name = editorKeyName(event);
        const replace = name === (isMacPlatform() ? 'Mod-Alt-f' : 'Mod-h');
        if (name !== 'Mod-f' && !replace) return;
        event.preventDefault();
        findBar.open({ replace });
    };
    element.addEventListener('keydown', onFindKey);

    // ---- where a popup hangs from ---------------------------------------------------------------

    /** The caret's own rectangle, as an element popups can be anchored to. */
    function placeCaret() {
        if (!caretEl || !contentEl) return;
        const rect = view?.selectionRect();
        if (!rect) return;
        const host = element.getBoundingClientRect();
        caretEl.style.top = `${rect.top - host.top}px`;
        caretEl.style.left = `${rect.left - host.left}px`;
        caretEl.style.width = `${Math.max(1, rect.width)}px`;
        caretEl.style.height = `${rect.height}px`;
    }

    function openPanel(overlay: Overlay, name: string, event?: MouseEvent) {
        if (event) anchors.set(name, event.currentTarget as HTMLElement);
        else anchors.delete(name);
        closePanels(overlay);
        overlay.open();
        overlay.update();
    }

    const panels = () => [linkPanel, imagePanel, tablePanel, colorPanel];
    const closePanels = (except?: Overlay) => panels().forEach((overlay) => overlay !== except && overlay.close());
    const renderPanels = () => panels().forEach((overlay) => overlay.update());

    // ---- the toolbar -----------------------------------------------------------------------------

    function toolbarContext(): ToolbarContext {
        return {
            locale: locale(),
            part,
            editable: editable(),
            can,
            isActive: (name, attrs) => editor.isActive(name, attrs as never),
            shortcut: (name, args) => {
                const binding = editorShortcutFor(name, args);
                return binding ? { label: formatEditorShortcut(binding), aria: ariaEditorShortcut(binding) } : undefined;
            },
            colors: { text: colorOf('color'), highlight: colorOf('highlight') },
            ref: (name) => (el) => {
                if (el) anchors.set(name, el as HTMLElement);
                else anchors.delete(name);
            },
            on: {
                tip: (element, text) => tooltips.attach(element, text),
                command: (name, args, event) => {
                    run(name, ...args);
                    if (event.detail > 0) focus();
                },
                openLink: (event) => openLinkPanel(event),
                openFind: () => (findBar.isOpen ? findBar.close() : findBar.open()),
                openImage: (event) => openPanel(imagePanel, 'image', event),
                openTable: (event) => openPanel(tablePanel, 'table', event),
                openMath: (event) => {
                    closePanels();
                    // On a formula it hangs from the formula; for a new one, from the button.
                    mathTools.open(editor.isActive('math') ? null : (event.currentTarget as HTMLElement));
                },
                openColor: (kind, event) => {
                    colorKind = kind;
                    openPanel(colorPanel, kind, event);
                },
                blockSelect: (el) => {
                    blockSelectHost = (el as HTMLElement | null) ?? null;
                    syncBlockSelect();
                }
            }
        };
    }

    /** The block type, drawn by the control kit's select. */
    function syncBlockSelect() {
        if (!blockSelectHost) return;
        const words = locale().editor;
        const options = [
            { label: words.paragraph, value: 'paragraph' },
            { label: words.heading1, value: 'heading1' },
            { label: words.heading2, value: 'heading2' },
            { label: words.heading3, value: 'heading3' },
            { label: words.codeBlock, value: 'codeBlock' }
        ];
        const active = activeEditorBlockType(editor.state);
        const settings = {
            options,
            optionValue: 'value',
            value: active,
            size: 'small' as const,
            ariaLabel: words.blockType,
            disabled: !editable(),
            locale: locale(),
            unstyled: current.unstyled,
            overlayTarget: current.overlayTarget,
            zIndex: current.zIndex,
            nonce: current.nonce,
            cssLayer: current.cssLayer
        };
        if (blockSelect) blockSelect.update(settings);
        else
            blockSelect = createSelect(blockSelectHost, {
                ...settings,
                onChange: (value) => {
                    if (value === 'paragraph') run('setParagraph');
                    else if (value === 'codeBlock') run('toggleCodeBlock');
                    else run('toggleHeading', Number(String(value).slice(-1)));
                    focus();
                }
            });
    }

    // ---- drawing --------------------------------------------------------------------------------

    /** The groups of the toolbar, without the formula button where formulas are off. */
    const toolbarGroups = (): EditorToolbarItem[][] => {
        const groups = Array.isArray(current.toolbar) ? current.toolbar : defaultToolbar;
        return mathOn() ? groups : groups.map((group) => group.filter((item) => item !== 'math')).filter((group) => group.length);
    };

    function countText(): string {
        const words = locale().editor;
        const count = editor.characterCount();
        const characters = current.maxLength
            ? formatMessage(words.charactersLimit, { count, limit: current.maxLength })
            : formatMessage(count === 1 ? words.character : words.characters, { count });
        const mode = current.showCount === true ? 'characters' : current.showCount;
        if (mode === 'characters' || !mode) return characters;
        const wordCount = editor.wordCount();
        const wordText = formatMessage(wordCount === 1 ? words.word : words.words, { count: wordCount });
        return mode === 'words' ? wordText : `${wordText} · ${characters}`;
    }

    function contentView(): Child {
        return h(
            'div',
            mergeAttrs({ key: 'content', id: ids.content }, part('content'), {
                class: isEmptyEditorDoc(editor.state.doc) ? 'vt-editor-content-empty' : undefined,
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': current.ariaLabelledby ? undefined : current.ariaLabel,
                'aria-labelledby': current.ariaLabelledby,
                'aria-describedby': ids.help,
                'aria-readonly': current.readonly ? 'true' : undefined,
                'aria-disabled': current.disabled ? 'true' : undefined,
                'aria-invalid': current.invalid ? 'true' : undefined,
                'aria-placeholder': current.placeholder || undefined,
                'data-placeholder': current.placeholder || undefined,
                // How a formula answers a press, which is what its look under the pointer follows.
                'data-math-edit': mathOn() && editable() ? (mathOptions().inlineEdit === false ? 'panel' : 'inline') : undefined,
                contenteditable: editable() ? 'true' : 'false',
                tabindex: current.disabled ? '-1' : '0',
                spellcheck: 'true',
                translate: 'no',
                ref: (el: Element | null) => {
                    const next = el as HTMLElement | null;
                    if (next === contentEl) return;
                    contentEl = next;
                    attachView();
                },
                onFocus: (event: FocusEvent) => current.on?.focus?.(event),
                onBlur: (event: FocusEvent) => current.on?.blur?.(event)
            })
        );
    }

    function render() {
        const drawn = toolbarContext();
        root.attrs(part('root', { readonly: current.readonly, disabled: current.disabled, invalid: current.invalid }));
        root.render([
            current.hooks?.toolbar ? (current.hooks.toolbar() as Child) : current.toolbar === false ? null : toolbarView(drawn, toolbarGroups()),
            findBar.view(),
            contentView(),
            h('span', mergeAttrs({ key: 'caret', 'aria-hidden': 'true' }, part('caret'), { ref: (el: Element | null) => (caretEl = el as HTMLElement | null) })),
            h('span', { key: 'help', id: ids.help, style: visuallyHidden }, locale().editor.keyboardHelp),
            current.hooks?.footer
                ? (current.hooks.footer() as Child)
                : current.showCount
                  ? h('div', mergeAttrs({ key: 'footer' }, part('footer')), h('span', part('count', { limit: !!current.maxLength }), countText()))
                  : null
        ]);
        bars.sync([contentEl]);
        syncBlockSelect();
        syncBubble();
        renderPanels();
        blockHandle.sync();
        mathTools.sync();
    }

    function attachView() {
        view?.destroy();
        view = null;
        if (!contentEl) return;
        view = createEditorView(contentEl, editor, {
            editable,
            taskLabel: locale().editor.taskDone,
            selectedClass: 'vt-editor-node-selected',
            emptyClass: 'vt-editor-content-empty',
            chipClass: (kind) => (current.unstyled ? undefined : ['vt-editor-chip', kind ? `vt-editor-chip-${kind}` : ''].filter(Boolean).join(' ')),
            mathClass: ({ display, pending }) => (current.unstyled ? undefined : ['vt-editor-math', display ? 'vt-editor-math-display' : '', pending ? 'vt-editor-math-pending' : ''].filter(Boolean).join(' ')),
            // Ctrl/⌘+K opens the link editor, over the caret.
            handleKey: (_name, binding) => {
                if (binding?.[0] !== 'link' || !editable()) return false;
                openLinkPanel();
                return true;
            },
            linkHint: (href) => ({ ...tooltips.options(editorLinkHint(href, locale().editor.followLink)), placement: 'top' })
        });
        if (current.autofocus) view.focus();
    }

    const focus = () => view?.focus();

    render();

    const handle: TextEditorHandle = {
        element,
        update(next) {
            const content = 'content' in next;
            current = { ...current, ...next };
            if (content) editor.setContent(current.content ?? '', { emit: false });
            if ('maxLength' in next) editor.maxLength = current.maxLength ?? null;
            if ('math' in next) editor.mathOutput = mathOptions().output ?? 'drawing';
            render();
        },
        getHTML: (options) => editor.getHTML(options),
        getJSON: () => editor.getJSON(),
        getText: () => editor.getText(),
        getMarkdown: () => editor.getMarkdown(),
        typeText: (text) => {
            const typed = editor.typeText(text);
            render();
            return typed;
        },
        setContent: (value) => {
            editor.setContent(value);
            render();
        },
        run: (name, ...args) => {
            const applied = run(name, ...args);
            render();
            return applied;
        },
        can,
        isActive: (name, attrs) => editor.isActive(name, attrs as never),
        focus,
        openFind: (options) => findBar.open(options),
        closeFind: () => findBar.close({ focusEditor: false }),
        refresh: render,
        destroy() {
            stop();
            element.removeEventListener('keydown', onFindKey);
            findBar.destroy();
            slashMenu.destroy();
            chipMenu.destroy();
            mathTools.destroy();
            blockHandle.destroy();
            [...panels(), bubble].forEach((overlay) => overlay.destroy());
            blockSelect?.destroy();
            tooltips.destroy();
            bars.destroy();
            view?.destroy();
            root.clear();
        }
    };

    return handle;
}
