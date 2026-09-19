import { cellEntries, formatMessage, visuallyHidden, type BoardEntry, type Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, type Child, type Props, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { countOf, countText, isDisabled, isLocked, laneCount, labelOf, wipOf, type BoardSettings } from '../engine/state';
import type { Content, TaskboardColumn, TaskboardConfig, TaskboardLane } from '../engine/types';

/**
 * The board as plain objects: a grid of column headers, lane headers and
 * cells, each cell a list named by its column (and lane) with its card count,
 * and every card a focusable item. What is drawn is decided here; what happens
 * when it is pressed is the handle's.
 */

/** An icon by name, drawn the way the icon component draws it. */
export const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);

const content = (value: Content): Child => (value === null || value === undefined ? null : value);

export interface CardView {
    item: unknown;
    key: string;
    index: number;
}

export interface ViewContext {
    config: TaskboardConfig;
    settings: BoardSettings;
    locale: Locale;
    /** The columns in the order they are drawn, with a column being moved already moved. */
    columns: TaskboardColumn[];
    /** The columns as they stand, which is what an index refers to. */
    declaredColumns: TaskboardColumn[];
    lanes: TaskboardLane[] | null;
    /** The cards as they are drawn, with a card being carried already moved. */
    entries: BoardEntry[];
    ids: { help: string; columnHelp: string; title: (key: unknown) => string; count: (key: unknown) => string; list: (column: unknown, lane?: unknown) => string; card: (key: string) => string; handle: (key: unknown) => string };
    /** Gives a control the tooltip that says what it does. */
    tip: (element: Element | null, text: string | undefined) => void;
    announcement: string;
    /** The classes and pass-through of one part in one state. */
    part: (name: string, state?: unknown) => Props;
    keyOf: (item: unknown) => string;
    isCollapsed: (column: TaskboardColumn) => boolean;
    isLaneCollapsed: (lane: TaskboardLane) => boolean;
    /** The card that holds the tab stop. */
    tabbableKey: string | null;
    movable: (item: unknown) => boolean;
    columnState: (column: TaskboardColumn) => Record<string, unknown>;
    cellState: (column: TaskboardColumn, lane: TaskboardLane | undefined) => Record<string, unknown>;
    cardState: (key: string, item: unknown) => Record<string, unknown>;
    on: BoardActions;
}

export interface BoardActions {
    toggleColumn: (column: TaskboardColumn) => void;
    toggleLane: (lane: TaskboardLane) => void;
    cardPointerdown: (event: PointerEvent, item: unknown) => void;
    cardKeydown: (event: KeyboardEvent, item: unknown, column: TaskboardColumn) => void;
    cardClick: (event: Event, item: unknown, column: TaskboardColumn) => void;
    cardFocus: (key: string) => void;
    handlePointerdown: (event: PointerEvent, column: TaskboardColumn) => void;
    handleKeydown: (event: KeyboardEvent, column: TaskboardColumn) => void;
    focusout: () => void;
}

const cardsIn = (context: ViewContext, column: TaskboardColumn, lane: TaskboardLane | undefined): CardView[] =>
    cellEntries(context.entries, column.key, lane?.key).map(({ entry }, index) => ({ item: entry.item, key: context.keyOf(entry.item), index }));

export function boardView(context: ViewContext): Child[] {
    const { part, locale, settings } = context;
    const laneRows: (TaskboardLane | undefined)[] = context.lanes ?? [undefined];
    const gridStyle = {
        'grid-template-columns': context.columns
            .map((column) => (context.isCollapsed(column) ? 'var(--vt-taskboard-column-collapsed-width)' : 'var(--vt-taskboard-column-width)'))
            .join(' ')
    };

    return [
        h(
            'div',
            mergeAttrs({ key: 'grid' }, part('grid'), { style: gridStyle }),
            context.columns.map((column) => columnHeader(context, column)),
            laneRows.flatMap((lane, row) => [
                lane ? laneHeader(context, lane) : null,
                ...(lane && context.isLaneCollapsed(lane) ? [] : context.columns.map((column) => cellView(context, column, lane, row, laneRows.length)))
            ]),
            context.columns.map((column) =>
                h(
                    'div',
                    mergeAttrs({ key: `f-${column.key}` }, part('footer', context.columnState(column))),
                    context.isCollapsed(column)
                        ? null
                        : content(
                              context.config.content?.columnFooter?.({
                                  column,
                                  count: countOf(context.entries, column),
                                  wip: wipOf(context.entries, column),
                                  collapsed: false,
                                  toggle: () => context.on.toggleColumn(column)
                              })
                          )
                )
            )
        ),
        h('span', { key: 'help', id: context.ids.help, hidden: true }, locale.aria.taskboardInstructions),
        h('span', { key: 'column-help', id: context.ids.columnHelp, hidden: true }, locale.aria.taskboardColumnInstructions),
        h(
            'span',
            mergeAttrs({ key: 'status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, part('status'), { style: visuallyHidden }),
            context.announcement
        )
    ];
}

function columnHeader(context: ViewContext, column: TaskboardColumn): Child {
    const { part, locale, settings } = context;
    const collapsed = context.isCollapsed(column);
    const name = column.title ?? String(column.key);
    const count = countOf(context.entries, column);
    const lists = (context.lanes ?? [undefined])
        .filter((lane) => !lane || !context.isLaneCollapsed(lane))
        .map((lane) => context.ids.list(column.key, lane?.key))
        .join(' ');
    return h(
        'div',
        mergeAttrs({ key: `h-${column.key}`, 'data-vt-column-header': '', 'data-key': String(column.key) }, part('header', context.columnState(column))),
        column.color ? h('span', mergeAttrs({ key: 'accent', 'aria-hidden': 'true' }, part('accent'), { style: { background: column.color } })) : null,
        settings.collapsible
            ? h(
                  'button',
                  mergeAttrs({ key: 'toggle', type: 'button' }, part('toggle'), {
                      'aria-label': formatMessage(locale.aria.taskboardToggle, { name }),
                      'aria-expanded': collapsed ? 'false' : 'true',
                      'aria-controls': collapsed ? undefined : lists || undefined,
                      ref: (element: Element | null) => context.tip(element, formatMessage(locale.aria.taskboardToggle, { name })),
                      onClick: () => context.on.toggleColumn(column)
                  }),
                  iconView(collapsed ? 'chevronRight' : 'chevronDown')
              )
            : null,
        content(
            context.config.content?.columnHeader?.({ column, count, wip: wipOf(context.entries, column), collapsed, toggle: () => context.on.toggleColumn(column) })
        ) ?? h('span', mergeAttrs({ key: 'title', id: context.ids.title(column.key) }, part('title')), name),
        h(
            'span',
            mergeAttrs({ key: 'count', 'aria-hidden': 'true' }, part('count', { wip: wipOf(context.entries, column) })),
            column.wipLimit !== undefined ? `${count}/${column.wipLimit}` : String(count)
        ),
        h('span', { key: 'count-text', id: context.ids.count(column.key), style: visuallyHidden }, countText(context.entries, column, locale)),
        settings.reorderColumns && !collapsed
            ? h(
                  'button',
                  mergeAttrs({ key: 'handle', id: context.ids.handle(column.key), type: 'button' }, part('handle', { grabbed: context.columnState(column).dragging }), {
                      'aria-label': formatMessage(locale.aria.taskboardMoveColumn, { column: name }),
                      'aria-describedby': context.ids.columnHelp,
                      disabled: settings.disabled || column.locked,
                      ref: (element: Element | null) => context.tip(element, formatMessage(locale.aria.taskboardMoveColumn, { column: name })),
                      onPointerdown: (event: PointerEvent) => context.on.handlePointerdown(event, column),
                      onKeydown: (event: KeyboardEvent) => context.on.handleKeydown(event, column)
                  }),
                  iconView('grip')
              )
            : null
    );
}

function laneHeader(context: ViewContext, lane: TaskboardLane): Child {
    const { part, locale, settings } = context;
    const collapsed = context.isLaneCollapsed(lane);
    const name = lane.title ?? String(lane.key);
    const count = laneCount(context.entries, lane);
    const lists = context.columns
        .filter((column) => !context.isCollapsed(column))
        .map((column) => context.ids.list(column.key, lane.key))
        .join(' ');
    return h(
        'div',
        mergeAttrs({ key: `l-${lane.key}` }, part('laneHeader', { collapsed })),
        settings.collapsible
            ? h(
                  'button',
                  mergeAttrs({ key: 'toggle', type: 'button' }, part('toggle'), {
                      'aria-label': formatMessage(locale.aria.taskboardToggle, { name }),
                      'aria-expanded': collapsed ? 'false' : 'true',
                      'aria-controls': collapsed ? undefined : lists || undefined,
                      ref: (element: Element | null) => context.tip(element, formatMessage(locale.aria.taskboardToggle, { name })),
                      onClick: () => context.on.toggleLane(lane)
                  }),
                  iconView(collapsed ? 'chevronRight' : 'chevronDown')
              )
            : null,
        content(context.config.content?.laneHeader?.({ lane, count, collapsed, toggle: () => context.on.toggleLane(lane) })) ?? [
            h('span', mergeAttrs({ key: 'title' }, part('laneTitle')), name),
            h('span', mergeAttrs({ key: 'count' }, part('laneCount')), `(${count})`)
        ]
    );
}

function cellView(context: ViewContext, column: TaskboardColumn, lane: TaskboardLane | undefined, row: number, rows: number): Child {
    const { part, locale, config } = context;
    const collapsed = context.isCollapsed(column);
    const cards = cardsIn(context, column, lane);
    const name = column.title ?? String(column.key);
    return h(
        'div',
        mergeAttrs(
            {
                key: `c-${column.key}-${lane?.key ?? ''}`,
                'data-vt-cell': '',
                'data-column': String(context.declaredColumns.indexOf(column)),
                'data-lane': lane ? String(context.lanes!.indexOf(lane)) : undefined
            },
            part('cell', { ...context.cellState(column, lane), last: row === rows - 1 })
        ),
        h(
            'ul',
            mergeAttrs({ key: 'list', id: context.ids.list(column.key, lane?.key), 'data-vt-list': '' }, part('list'), {
                'aria-labelledby': lane ? undefined : `${context.ids.title(column.key)} ${context.ids.count(column.key)}`,
                'aria-label': lane ? formatMessage(locale.aria.taskboardCell, { column: name, lane: lane.title ?? String(lane.key) }) : undefined,
                style: config.scrollHeight ? { 'max-height': config.scrollHeight } : undefined
            }),
            collapsed ? null : cards.map((card) => cardView(context, card, column, lane))
        ),
        collapsed && row === 0 ? h('span', mergeAttrs({ key: 'strip', 'aria-hidden': 'true' }, part('strip')), name) : null,
        collapsed
            ? null
            : [
                  cards.length ? null : h('div', mergeAttrs({ key: 'empty' }, part('empty')), content(config.content?.empty?.({ column, lane })) ?? locale.aria.taskboardEmpty),
                  config.content?.addCard ? h('div', mergeAttrs({ key: 'add' }, part('addCard')), content(config.content.addCard({ column, lane }))) : null
              ]
    );
}

function cardView(context: ViewContext, card: CardView, column: TaskboardColumn, lane: TaskboardLane | undefined): Child {
    const { part, settings } = context;
    const state = context.cardState(card.key, card.item);
    return h(
        'li',
        mergeAttrs({ key: card.key, id: context.ids.card(card.key), 'data-vt-card': '', 'data-key': card.key }, part('card', state), {
            tabindex: !settings.disabled && card.key === context.tabbableKey ? '0' : '-1',
            'aria-describedby': context.movable(card.item) ? context.ids.help : undefined,
            'aria-disabled': settings.disabled || isDisabled(card.item, settings) ? 'true' : undefined,
            onPointerdown: (event: PointerEvent) => context.on.cardPointerdown(event, card.item),
            onKeydown: (event: KeyboardEvent) => context.on.cardKeydown(event, card.item, column),
            onClick: (event: MouseEvent) => context.on.cardClick(event, card.item, column),
            onFocus: () => context.on.cardFocus(card.key)
        }),
        isLocked(card.item, settings) ? iconView('lock', part('lockIcon')) : null,
        content(
            context.config.content?.card?.({
                item: card.item,
                column,
                lane,
                index: card.index,
                dragging: !!state.dragging,
                disabled: isDisabled(card.item, settings),
                locked: isLocked(card.item, settings)
            })
        ) ?? h('span', mergeAttrs({ key: 'title' }, part('cardTitle')), labelOf(card.item, settings))
    );
}

/** The card under the pointer while it is dragged, drawn over everything. */
export function previewView(context: ViewContext, item: unknown, column: TaskboardColumn, index: number, style: Record<string, string>): VElement {
    const { part, settings } = context;
    return h(
        'div',
        mergeAttrs({ 'aria-hidden': 'true' }, part('preview'), { style }),
        h(
            'div',
            part('card', { dragging: false, draggable: true }),
            content(context.config.content?.card?.({ item, column, lane: undefined, index, dragging: true, disabled: false, locked: false })) ??
                h('span', part('cardTitle'), labelOf(item, settings))
        )
    ) as VElement;
}
