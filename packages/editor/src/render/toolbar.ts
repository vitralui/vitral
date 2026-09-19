import { formatEditorShortcut, type EditorColor, type Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, type Child, type Props } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { editorButtons, shortcutCommands } from '../buttons';
import type { EditorButtonCommand, EditorToolbarItem } from '../types';

/**
 * The toolbar as plain objects: a group of buttons a command each, the block
 * type as a select, the two colour pickers, and the buttons that open a panel.
 * What is drawn is decided here; what happens when it is pressed is the
 * handle's.
 */

export interface ToolbarContext {
    locale: Locale;
    part: (name: string, state?: unknown) => Props;
    editable: boolean;
    /** Whether a command applies right now. */
    can: (name: string, ...args: unknown[]) => boolean;
    isActive: (name: string, attrs?: Record<string, unknown>) => boolean;
    /** The shortcut for a command, as a label and as `aria-keyshortcuts`. */
    shortcut: (name: string, args?: readonly unknown[]) => { label: string; aria: string } | undefined;
    on: ToolbarActions;
    /** The element each opener is drawn into, so a panel can hang from it. */
    ref: (name: string) => (element: Element | null) => void;
    colors: { text?: EditorColor; highlight?: EditorColor };
}

export interface ToolbarActions {
    command: (name: string, args: readonly unknown[], event: MouseEvent) => void;
    openLink: (event: MouseEvent) => void;
    openImage: (event: MouseEvent) => void;
    openTable: (event: MouseEvent) => void;
    openColor: (kind: 'color' | 'highlight', event: MouseEvent) => void;
    blockSelect: (element: Element | null) => void;
}

export const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);

const OPENERS: Partial<Record<EditorToolbarItem, { icon: string; label: (words: Locale['editor']) => string; action: keyof ToolbarActions }>> = {
    image: { icon: 'image', label: (words) => words.image, action: 'openImage' },
    table: { icon: 'table', label: (words) => words.table, action: 'openTable' }
};

/** One command's button: a toggle where the command has a pressed state. */
export function buttonView(context: ToolbarContext, item: EditorButtonCommand): Child {
    const { part, locale } = context;
    const spec = editorButtons[item];
    if (!spec) return null;
    const name = spec.label(locale.editor);
    const isLink = item === 'link';
    const pressed = spec.active ? context.isActive(spec.active[0], spec.active[1]) : undefined;
    const [command, ...args] = spec.command;
    const disabled = !context.editable || (isLink ? context.isActive('codeBlock') : !context.can(command, ...args));
    const [shortcutName, ...shortcutArgs] = shortcutCommands[item] ?? spec.command;
    const shortcut = context.shortcut(shortcutName, shortcutArgs);
    return h(
        'button',
        mergeAttrs({ key: item, type: 'button' }, part('button', { active: pressed, disabled }), {
            'aria-label': name,
            title: shortcut ? `${name} (${shortcut.label})` : name,
            'aria-pressed': isLink || pressed === undefined ? undefined : pressed ? 'true' : 'false',
            'aria-haspopup': isLink ? 'dialog' : undefined,
            'aria-keyshortcuts': shortcut?.aria,
            disabled,
            ref: isLink ? context.ref('link') : undefined,
            onClick: (event: MouseEvent) => (isLink ? context.on.openLink(event) : context.on.command(command, args, event))
        }),
        iconView(spec.icon.name, part('buttonIcon'))
    );
}

/** A button that opens a panel: the image and table pickers. */
function openerView(context: ToolbarContext, item: 'image' | 'table'): Child {
    const spec = OPENERS[item]!;
    const name = spec.label(context.locale.editor);
    return h(
        'button',
        mergeAttrs({ key: item, type: 'button' }, context.part('button', { disabled: !context.editable }), {
            'aria-label': name,
            title: name,
            'aria-haspopup': 'dialog',
            disabled: !context.editable,
            ref: context.ref(item),
            onClick: (event: MouseEvent) => (spec.action === 'openImage' ? context.on.openImage(event) : context.on.openTable(event))
        }),
        iconView(spec.icon, context.part('buttonIcon'))
    );
}

/** The text and highlight pickers: a button showing the colour in hand. */
function colorView(context: ToolbarContext, kind: 'color' | 'highlight'): Child {
    const { part, locale } = context;
    const name = kind === 'color' ? locale.editor.textColor : locale.editor.highlight;
    const chosen = context.colors[kind === 'color' ? 'text' : 'highlight'];
    return h(
        'button',
        mergeAttrs({ key: kind, type: 'button' }, part('button', { disabled: !context.editable }), {
            'aria-label': name,
            title: name,
            'aria-haspopup': 'dialog',
            disabled: !context.editable,
            ref: context.ref(kind),
            onClick: (event: MouseEvent) => context.on.openColor(kind, event)
        }),
        iconView(kind === 'color' ? 'textColor' : 'highlighter', part('buttonIcon')),
        h('span', mergeAttrs({ key: 'bar', 'aria-hidden': 'true' }, part('colorBar'), { style: { background: chosen ? (kind === 'color' ? chosen.text : chosen.highlight) : 'transparent' } }))
    );
}

/** The block type, as the select the control kit draws; the handle mounts it. */
function blockSelectView(context: ToolbarContext): Child {
    return h('span', mergeAttrs({ key: 'blockType' }, { ref: context.on.blockSelect }));
}

export function toolbarView(context: ToolbarContext, groups: EditorToolbarItem[][]): Child {
    const { part, locale } = context;
    return h(
        'div',
        mergeAttrs({ key: 'toolbar', role: 'toolbar' }, part('toolbar'), { 'aria-label': locale.editor.toolbar, 'aria-orientation': 'horizontal' }),
        groups.map((group, index) =>
            h(
                'div',
                mergeAttrs({ key: index, role: 'group' }, part('toolbarGroup')),
                group.map((item) =>
                    item === 'blockType'
                        ? blockSelectView(context)
                        : item === 'color' || item === 'highlight'
                          ? colorView(context, item)
                          : item === 'image' || item === 'table'
                            ? openerView(context, item)
                            : buttonView(context, item as EditorButtonCommand)
                )
            )
        )
    );
}

/** The floating toolbar over a selection: the same buttons, in one group. */
export function bubbleView(context: ToolbarContext, items: EditorToolbarItem[]): Child {
    return h(
        'div',
        mergeAttrs({ role: 'toolbar' }, context.part('bubble'), { 'aria-label': context.locale.editor.toolbar }),
        items.map((item) =>
            item === 'color' || item === 'highlight' ? colorView(context, item) : item === 'image' || item === 'table' ? openerView(context, item) : buttonView(context, item as EditorButtonCommand)
        )
    );
}

export const shortcutLabel = (binding: { key: string } | undefined): string | undefined => (binding ? formatEditorShortcut(binding.key) : undefined);
