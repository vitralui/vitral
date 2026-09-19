import { formatMessage, type EditorColor, type EditorNode, type Locale } from '@vitral/core';
import { h, mergeAttrs, type Child, type Props, type VElement } from '@vitral/dom';
import type { BlockAction, SlashCommand } from '../types';
import { iconView } from './toolbar';

/**
 * The panels the toolbar opens, and the two menus the text itself opens: the
 * one a `/` brings up in an empty block, and the one the handle beside a block
 * offers. All of them are listboxes or dialogs the handle puts in an overlay.
 */

export interface PanelContext {
    locale: Locale;
    part: (name: string, state?: unknown) => Props;
    ids: { slash: string; block: string };
}

// ---- the link panel ---------------------------------------------------------------

export interface LinkPanelState {
    href: string;
    text: string;
    newTab: boolean;
    /** Editing a link that is already there, rather than making one. */
    existing: boolean;
    error?: string;
}

export interface LinkPanelActions {
    change: (patch: Partial<LinkPanelState>) => void;
    apply: () => void;
    remove: () => void;
    cancel: () => void;
}

export function linkPanelView(context: PanelContext, state: LinkPanelState, on: LinkPanelActions): VElement {
    const { part, locale } = context;
    const words = locale.editor;
    const field = (label: string, value: string, key: 'href' | 'text', type = 'text') =>
        h(
            'label',
            mergeAttrs({ key }, part('field')),
            h('span', part('fieldLabel'), label),
            h(
                'span',
                { class: 'vt-field vt-field-sm vt-field-fluid' },
                h(
                    'input',
                    mergeAttrs({ type, class: 'vt-field-input' }, {
                        value,
                        onInput: (event: Event) => on.change({ [key]: (event.target as HTMLInputElement).value } as Partial<LinkPanelState>),
                        onKeydown: (event: KeyboardEvent) => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            on.apply();
                        }
                    })
                )
            )
        );
    return h(
        'div',
        mergeAttrs({ role: 'dialog' }, part('panel'), { 'aria-label': words.link }),
        field(words.linkUrl, state.href, 'href', 'url'),
        field(words.linkText, state.text, 'text'),
        h(
            'label',
            mergeAttrs({ key: 'newtab' }, part('check')),
            h('input', { type: 'checkbox', checked: state.newTab, onChange: (event: Event) => on.change({ newTab: (event.target as HTMLInputElement).checked }) }),
            h('span', null, words.openInNewTab)
        ),
        state.error ? h('span', mergeAttrs({ key: 'error', role: 'alert' }, part('fieldError')), state.error) : null,
        h(
            'div',
            mergeAttrs({ key: 'actions' }, part('actions')),
            state.existing
                ? h('button', mergeAttrs({ key: 'remove', type: 'button', class: 'vt-button vt-button-text vt-button-secondary vt-button-sm' }, { onClick: on.remove }), words.removeLink)
                : null,
            h('button', mergeAttrs({ key: 'cancel', type: 'button', class: 'vt-button vt-button-text vt-button-secondary vt-button-sm' }, { onClick: on.cancel }), locale.cancel),
            h('button', mergeAttrs({ key: 'apply', type: 'button', class: 'vt-button vt-button-sm' }, { onClick: on.apply }), words.apply)
        )
    ) as VElement;
}

// ---- the colour swatches ------------------------------------------------------------

export function colorPanelView(
    context: PanelContext,
    options: { kind: 'color' | 'highlight'; palette: readonly EditorColor[]; chosen?: EditorColor; onChoose: (color: EditorColor | null) => void }
): VElement {
    const { part, locale } = context;
    const words = locale.editor;
    const none = options.kind === 'color' ? words.defaultColor : words.noHighlight;
    const nameOf = (color: EditorColor) => words.colors[color.name] ?? color.name;
    return h(
        'div',
        mergeAttrs({ role: 'dialog' }, part('panel'), { 'aria-label': options.kind === 'color' ? words.textColor : words.highlight }),
        h(
            'div',
            mergeAttrs({ key: 'swatches', role: 'group' }, part('swatches')),
            [
                h(
                    'button',
                    mergeAttrs({ key: 'none', type: 'button' }, part('swatch', { none: true, kind: options.kind, selected: !options.chosen }), {
                        'aria-label': none,
                        title: none,
                        onClick: () => options.onChoose(null)
                    })
                ),
                ...options.palette.map((color) =>
                    h(
                        'button',
                        mergeAttrs({ key: color.name, type: 'button' }, part('swatch', { kind: options.kind, selected: options.chosen?.name === color.name }), {
                            'aria-label': nameOf(color),
                            title: nameOf(color),
                            style: { background: options.kind === 'color' ? color.text : color.highlight },
                            onClick: () => options.onChoose(color)
                        })
                    )
                )
            ]
        )
    ) as VElement;
}

// ---- the table picker ----------------------------------------------------------------

export function tablePanelView(context: PanelContext, on: { insert: (rows: number, columns: number) => void }): VElement {
    const { part, locale } = context;
    const words = locale.editor;
    const number = (label: string, name: 'rows' | 'columns', value: number) =>
        h(
            'label',
            mergeAttrs({ key: name }, part('field')),
            h('span', part('fieldLabel'), label),
            h(
                'span',
                { class: 'vt-field vt-field-sm' },
                h('input', { type: 'number', min: '1', max: '20', value: String(value), class: 'vt-field-input', 'data-vt-table': name })
            )
        );
    const read = (element: Element | null, name: string, fallback: number) => {
        const input = element?.querySelector<HTMLInputElement>(`[data-vt-table="${name}"]`);
        const value = Number(input?.value);
        return Number.isFinite(value) && value > 0 ? Math.min(20, Math.round(value)) : fallback;
    };
    return h(
        'div',
        mergeAttrs({ role: 'dialog' }, part('panel'), { 'aria-label': words.table }),
        number(words.tableRows, 'rows', 3),
        number(words.tableColumns, 'columns', 3),
        h(
            'div',
            mergeAttrs({ key: 'actions' }, part('actions')),
            h(
                'button',
                mergeAttrs({ type: 'button', class: 'vt-button vt-button-sm' }, {
                    onClick: (event: MouseEvent) => {
                        const panel = (event.currentTarget as HTMLElement).closest('[role="dialog"]');
                        on.insert(read(panel, 'rows', 3), read(panel, 'columns', 3));
                    }
                }),
                words.insertTable
            )
        )
    ) as VElement;
}

// ---- the image panel -------------------------------------------------------------------

export function imagePanelView(context: PanelContext, on: { insert: (src: string, alt: string) => void; cancel: () => void }): VElement {
    const { part, locale } = context;
    const words = locale.editor;
    const field = (label: string, name: string, type = 'text') =>
        h(
            'label',
            mergeAttrs({ key: name }, part('field')),
            h('span', part('fieldLabel'), label),
            h('span', { class: 'vt-field vt-field-sm vt-field-fluid' }, h('input', { type, class: 'vt-field-input', 'data-vt-image': name }))
        );
    const read = (element: Element | null, name: string) => element?.querySelector<HTMLInputElement>(`[data-vt-image="${name}"]`)?.value ?? '';
    return h(
        'div',
        mergeAttrs({ role: 'dialog' }, part('panel'), { 'aria-label': words.image }),
        field(words.imageUrl, 'src', 'url'),
        field(words.imageAlt, 'alt'),
        h(
            'div',
            mergeAttrs({ key: 'actions' }, part('actions')),
            h('button', mergeAttrs({ key: 'cancel', type: 'button', class: 'vt-button vt-button-text vt-button-secondary vt-button-sm' }, { onClick: on.cancel }), locale.cancel),
            h(
                'button',
                mergeAttrs({ key: 'insert', type: 'button', class: 'vt-button vt-button-sm' }, {
                    onClick: (event: MouseEvent) => {
                        const panel = (event.currentTarget as HTMLElement).closest('[role="dialog"]');
                        on.insert(read(panel, 'src'), read(panel, 'alt'));
                    }
                }),
                words.insert
            )
        )
    ) as VElement;
}

// ---- the slash menu ----------------------------------------------------------------------

export interface SlashMenuState {
    query: string;
    items: SlashCommand[];
    active: number;
}

/**
 * What a `/` opens: a listbox of commands, filtered as it is typed. The text
 * keeps the keyboard — the caret is still in the document — so the list is
 * pointed at through `aria-activedescendant` rather than focused.
 */
export function slashMenuView(context: PanelContext, state: SlashMenuState, on: { choose: (index: number) => void }): VElement {
    const { part, locale } = context;
    const optionId = (index: number) => `${context.ids.slash}-option-${index}`;
    return h(
        'div',
        mergeAttrs({ id: context.ids.slash }, part('slashMenu')),
        state.items.length
            ? h(
                  'ul',
                  mergeAttrs({ role: 'listbox' }, part('slashList'), { 'aria-label': locale.editor.slashMenu }),
                  state.items.map((item, index) =>
                      h(
                          'li',
                          mergeAttrs({ key: item.id, id: optionId(index), role: 'option' }, part('slashItem', { focused: index === state.active }), {
                              'aria-selected': index === state.active ? 'true' : 'false',
                              onMousedown: (event: MouseEvent) => event.preventDefault(),
                              onClick: () => on.choose(index),
                              onMousemove: () => {
                                  if (state.active === index) return;
                                  state.active = index;
                              }
                          }),
                          item.icon ? iconView(item.icon, part('slashIcon')) : null,
                          h(
                              'span',
                              part('slashText'),
                              h('span', part('slashLabel'), item.label),
                              item.description ? h('span', part('slashDescription'), item.description) : null
                          )
                      )
                  )
              )
            : h('div', mergeAttrs({ role: 'status' }, part('slashEmpty')), formatMessage(locale.editor.slashEmpty, { query: state.query }))
    ) as VElement;
}

// ---- the block handle's menu ----------------------------------------------------------------

export function blockMenuView(context: PanelContext, block: EditorNode, actions: BlockAction[], on: { choose: (id: string) => void }): VElement {
    const { part, locale } = context;
    return h(
        'div',
        mergeAttrs({ id: context.ids.block, role: 'menu' }, part('blockMenu'), { 'aria-label': locale.editor.blockMenu }),
        actions
            .filter((action) => !action.when || action.when(block))
            .map((action) =>
                h(
                    'button',
                    mergeAttrs({ key: action.id, type: 'button', role: 'menuitem' }, part('blockItem'), { onClick: () => on.choose(action.id) }),
                    action.icon ? iconView(action.icon, part('blockIcon')) : null,
                    h('span', null, action.label)
                )
            )
    ) as VElement;
}

/** The handle beside the block the caret is in: it drags nothing yet, it opens the menu. */
export function blockHandleView(context: PanelContext, on: { open: (event: MouseEvent) => void }, position: { top: number; left: number }): Child {
    const { part, locale } = context;
    return h(
        'button',
        mergeAttrs({ key: 'block-handle', type: 'button' }, part('blockHandle'), {
            'aria-label': locale.editor.blockMenu,
            'aria-haspopup': 'menu',
            style: { top: `${position.top}px`, left: `${position.left}px` },
            onMousedown: (event: MouseEvent) => event.preventDefault(),
            onClick: on.open
        }),
        iconView('grip', part('blockHandleIcon'))
    );
}
