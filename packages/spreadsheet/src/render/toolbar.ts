import type { Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, type Child, type Props } from '@vitral/dom';
import { spreadsheetButtons } from '../buttons';
import type { CellFormat, SpreadsheetToolbarItem } from '../engine/types';

/**
 * The toolbar as plain objects: groups of buttons a command each, and the
 * number format as the select the control kit draws. What is drawn is decided
 * here; what happens when it is pressed is the handle's.
 *
 * The icon is the definition the button spec holds, not a name looked up in a
 * registry: a toolbar must not go blank because the application never
 * registered the icons its own components ship with.
 */

export interface ToolbarContext {
    locale: Locale;
    part: (name: string, state?: unknown) => Props;
    /** Nothing can be typed into the sheet: everything but undo and redo is off. */
    readonly: boolean;
    canUndo: boolean;
    canRedo: boolean;
    /** The format of the cell the caret is in, which the pressed states read. */
    format: CellFormat | undefined;
    on: ToolbarActions;
    /** Where the format select is mounted. */
    formatRef: (element: Element | null) => void;
}

export interface ToolbarActions {
    press: (item: SpreadsheetToolbarItem, event: MouseEvent) => void;
    keydown: (event: KeyboardEvent) => void;
    /** Gives a button the tooltip that says what it is. */
    tip: (element: Element | null, text: string) => void;
}

export function buttonView(context: ToolbarContext, item: Exclude<SpreadsheetToolbarItem, 'numberFormat'>, tabbable: boolean): Child {
    const spec = spreadsheetButtons[item];
    if (!spec) return null;
    const { part, locale } = context;
    const name = spec.label(locale.spreadsheet);
    const pressed = spec.active?.(context.format);
    const command = spec.command;
    const disabled = command.kind === 'history' ? (command.step === 'undo' ? !context.canUndo : !context.canRedo) : context.readonly;
    return h(
        'button',
        mergeAttrs({ key: item, type: 'button' }, part('button', { active: pressed, disabled }), {
            'aria-label': name,
            'aria-pressed': pressed === undefined ? undefined : pressed ? 'true' : 'false',
            tabindex: tabbable ? 0 : -1,
            disabled,
            ref: (element: Element | null) => context.on.tip(element, name),
            onClick: (event: MouseEvent) => context.on.press(item, event)
        }),
        iconNode(spec.icon, part('buttonIcon'))
    );
}

/** The number format, drawn by the control kit's select; the handle mounts it. */
const formatView = (context: ToolbarContext): Child => h('span', mergeAttrs({ key: 'numberFormat' }, { ref: context.formatRef }));

export function toolbarView(context: ToolbarContext, groups: SpreadsheetToolbarItem[][], tabStop: SpreadsheetToolbarItem | undefined): Child {
    const { part, locale, on } = context;
    return h(
        'div',
        mergeAttrs({ key: 'toolbar', role: 'toolbar' }, part('toolbar'), {
            'aria-label': locale.spreadsheet.toolbar,
            'aria-orientation': 'horizontal',
            onKeydown: on.keydown
        }),
        groups.map((group, index) =>
            h(
                'div',
                mergeAttrs({ key: index, role: 'group' }, part('toolbarGroup')),
                group.map((item) => (item === 'numberFormat' ? formatView(context) : buttonView(context, item, item === tabStop)))
            )
        )
    );
}
