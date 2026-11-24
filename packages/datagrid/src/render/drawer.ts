import { h, mergeAttrs, type Child } from '@vitral/dom';
import type { DataGridAggregate } from '../engine/types';
import { iconView, type ViewContext } from './grid';

/**
 * The columns drawer: a dialog at the page's edge where the reader arranges
 * the table at leisure — which columns show and in what order, how the rows
 * are grouped (or pivoted), how each number column is worked out — and only
 * "Apply" changes the table.
 */
export type DrawerTab = 'visible' | 'organize' | 'values';

export interface ColumnsDrawerView {
    tab: DrawerTab;
    columns: { key: string; header: string; visible: boolean }[];
    dragging: string | null;
    dropOn: string | null;
    /** The pivot can be turned on here: the side bar has its panel, or the host gave one. */
    pivotAvailable: boolean;
    pivot: boolean;
    /** The fields rows can be grouped by. */
    fields: { field: string; header: string }[];
    groupBy: string[];
    pivotColumns: string[];
    /** The number columns, as the search finds them, and how each is worked out. */
    values: { key: string; header: string; how: DataGridAggregate | null }[];
    search: string;
}

const TABS: DrawerTab[] = ['visible', 'organize', 'values'];
const HOWS: DataGridAggregate[] = ['sum', 'avg', 'count', 'min', 'max'];

/** A switch as Vitral's ToggleSwitch draws one: a checkbox with the role, over a drawn pill. */
function switchView<T>(context: ViewContext<T>, checked: boolean, label: string, onChange: (on: boolean) => void, extra: Record<string, unknown> = {}): Child {
    const { part } = context;
    return h(
        'span',
        part('drawerSwitch', { checked }),
        h(
            'span',
            part('drawerSwitchTrack'),
            h(
                'input',
                mergeAttrs({ type: 'checkbox', role: 'switch' }, part('drawerSwitchInput'), {
                    checked,
                    'aria-label': label,
                    onChange: (event: Event) => onChange((event.target as HTMLInputElement).checked),
                    ...extra
                })
            ),
            h('span', part('drawerSwitchKnob'))
        )
    );
}

/** A native select of fields, "None" first: native, so the keyboard, touch and screen readers get what they know. */
function fieldSelect<T>(context: ViewContext<T>, id: string, label: string, value: string | null, options: { value: string; label: string }[], onPick: (value: string | null) => void): Child {
    const { part, locale } = context;
    return h(
        'label',
        mergeAttrs({ key: id }, part('drawerField')),
        h('span', part('drawerFieldLabel'), label),
        h(
            'select',
            mergeAttrs(part('drawerSelect'), {
                'data-drawer-select': id,
                value: value ?? '',
                onChange: (event: Event) => onPick((event.target as HTMLSelectElement).value || null)
            }),
            h('option', { value: '', selected: !value }, locale.datagrid.drawerNone),
            options.map((option) => h('option', { key: option.value, value: option.value, selected: option.value === value }, option.label))
        )
    );
}

function visibleTab<T>(context: ViewContext<T>, view: ColumnsDrawerView): Child[] {
    const { part, locale, on } = context;
    const words = locale.datagrid;
    const shown = view.columns.filter((column) => column.visible).length;
    return [
        h('p', mergeAttrs({ key: 'help' }, part('drawerHelp')), words.drawerVisibleHelp),
        h(
            'div',
            mergeAttrs({ key: 'all' }, part('drawerAll')),
            switchView(context, shown === view.columns.length, words.drawerAll, (checked) => on.drawerAll(checked), {
                'aria-checked': shown === view.columns.length ? 'true' : shown === 0 ? 'false' : 'mixed',
                'data-drawer-all': ''
            }),
            h('span', { 'aria-hidden': 'true' }, words.drawerAll)
        ),
        h(
            'ul',
            mergeAttrs({ key: 'cards' }, part('drawerCards'), { 'aria-label': words.drawerVisible }),
            view.columns.map((column) =>
                h(
                    'li',
                    mergeAttrs({ key: column.key }, part('drawerCard', { dragging: view.dragging === column.key, dropping: view.dropOn === column.key && view.dragging !== column.key }), {
                        'data-drawer-column': column.key,
                        draggable: 'true',
                        onDragstart: (event: DragEvent) => on.drawerDragStart(column.key, event),
                        onDragover: (event: DragEvent) => on.drawerDragOver(column.key, event),
                        onDrop: (event: DragEvent) => on.drawerDrop(event),
                        onDragend: () => on.drawerDragEnd()
                    }),
                    h(
                        'span',
                        mergeAttrs(part('drawerHandle'), {
                            role: 'button',
                            tabindex: '0',
                            'aria-label': `${words.moveColumn.replace('{column}', column.header)}. ${words.drawerMoveHint}`,
                            onKeydown: (event: KeyboardEvent) => on.drawerMoveKey(column.key, event)
                        }),
                        iconView('grip')
                    ),
                    switchView(context, column.visible, column.header, (checked) => on.drawerToggle(column.key, checked)),
                    h('span', part('drawerCardTitle'), column.header)
                )
            )
        )
    ];
}

function organizeTab<T>(context: ViewContext<T>, view: ColumnsDrawerView): Child[] {
    const { part, locale, on } = context;
    const words = locale.datagrid;
    const options = view.fields.map((field) => ({ value: field.field, label: field.header }));
    const headerOf = (field: string) => view.fields.find((entry) => entry.field === field)?.header ?? field;
    const [first = null, second = null] = view.groupBy;
    return [
        h('p', mergeAttrs({ key: 'help' }, part('drawerHelp')), words.drawerOrganizeHelp),
        view.pivotAvailable
            ? h(
                  'div',
                  mergeAttrs({ key: 'pivot' }, part('drawerAll')),
                  switchView(context, view.pivot, words.pivotMode, (checked) => on.drawerPivot(checked), { 'data-drawer-pivot': '' }),
                  h('span', { 'aria-hidden': 'true' }, words.pivotMode)
              )
            : null,
        h(
            'div',
            mergeAttrs({ key: 'selects' }, part('drawerFields')),
            fieldSelect(context, 'group', view.pivot ? words.pivotRows : words.drawerGroupBy, first, options, (field) => on.drawerGroup(0, field)),
            fieldSelect(
                context,
                'subgroup',
                words.drawerSubgroup,
                second,
                options.filter((option) => option.value !== first),
                (field) => on.drawerGroup(1, field)
            ),
            view.pivot ? fieldSelect(context, 'pivot-columns', words.pivotColumns, view.pivotColumns[0] ?? null, options, (field) => on.drawerPivotColumn(field)) : null
        ),
        h(
            'section',
            mergeAttrs({ key: 'groups' }, part('drawerGroups'), { 'aria-label': words.drawerRowGroups }),
            h('h3', part('drawerGroupsTitle'), words.drawerRowGroups),
            view.groupBy.length
                ? h(
                      'ol',
                      part('drawerChips'),
                      view.groupBy.map((field, level) => h('li', mergeAttrs({ key: field }, part('drawerChip'), { 'data-drawer-group': field }), level ? `↳ ${headerOf(field)}` : headerOf(field)))
                  )
                : h('p', part('drawerEmpty'), words.drawerNoGrouping)
        )
    ];
}

function valuesTab<T>(context: ViewContext<T>, view: ColumnsDrawerView): Child[] {
    const { part, locale, on } = context;
    const words = locale.datagrid;
    return [
        h('p', mergeAttrs({ key: 'help' }, part('drawerHelp')), words.drawerValuesHelp),
        h(
            'div',
            mergeAttrs({ key: 'tools' }, part('drawerTools')),
            h(
                'span',
                part('filterField'),
                iconView('search'),
                h(
                    'input',
                    mergeAttrs({ type: 'search' }, part('filterInput'), {
                        value: view.search,
                        placeholder: words.searchColumns,
                        'aria-label': words.searchColumns,
                        'data-drawer-search': '',
                        onInput: (event: Event) => on.drawerSearch((event.target as HTMLInputElement).value)
                    })
                )
            ),
            h('button', mergeAttrs({ type: 'button' }, part('drawerButton', { variant: 'text' }), { 'data-drawer-clear': '', onClick: () => on.drawerClear() }), words.drawerClearValues)
        ),
        view.values.length
            ? h(
                  'table',
                  mergeAttrs({ key: 'values' }, part('drawerTable')),
                  h('thead', null, h('tr', null, h('th', { scope: 'col' }, words.drawerColumn), h('th', { scope: 'col' }, words.drawerValue))),
                  h(
                      'tbody',
                      null,
                      view.values.map((entry) =>
                          h(
                              'tr',
                              { key: entry.key, 'data-drawer-value': entry.key },
                              h('th', { scope: 'row' }, entry.header),
                              h(
                                  'td',
                                  null,
                                  h(
                                      'select',
                                      mergeAttrs(part('drawerSelect'), {
                                          'aria-label': `${words.drawerValue}: ${entry.header}`,
                                          onChange: (event: Event) => on.drawerAggregate(entry.key, ((event.target as HTMLSelectElement).value || null) as DataGridAggregate | null)
                                      }),
                                      h('option', { value: '', selected: !entry.how }, words.drawerNone),
                                      HOWS.map((how) => h('option', { key: how, value: how, selected: entry.how === how }, words.aggregates[how]))
                                  )
                              )
                          )
                      )
                  )
              )
            : h('p', mergeAttrs({ key: 'empty' }, part('drawerEmpty')), words.drawerNoValues)
    ];
}

export function drawerView<T>(context: ViewContext<T>, view: ColumnsDrawerView): Child {
    const { part, locale, on, ids } = context;
    const words = locale.datagrid;
    const tabName: Record<DrawerTab, string> = { visible: words.drawerVisible, organize: words.drawerOrganize, values: words.drawerValues };
    const tabId = (tab: DrawerTab) => `${ids.table}-drawer-tab-${tab}`;
    const panelId = `${ids.table}-drawer-panel`;
    const titleId = `${ids.table}-drawer-title`;
    return h(
        'div',
        mergeAttrs({ key: 'drawer-mask' }, part('drawerMask'), {
            onClick: (event: MouseEvent) => {
                if (event.target === event.currentTarget) on.drawerCancel();
            }
        }),
        h(
            'div',
            mergeAttrs(part('drawer'), {
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': titleId,
                tabindex: '-1',
                'data-columns-drawer': '',
                onKeydown: (event: KeyboardEvent) => {
                    if (event.key !== 'Escape') return;
                    event.stopPropagation();
                    on.drawerCancel();
                }
            }),
            h(
                'div',
                part('drawerHeader'),
                h('h2', mergeAttrs(part('drawerTitle'), { id: titleId }), words.columnsPanel),
                h('button', mergeAttrs({ type: 'button' }, part('drawerClose'), { 'aria-label': words.drawerCancel, onClick: () => on.drawerCancel() }), iconView('close'))
            ),
            h(
                'div',
                mergeAttrs(part('drawerTabs'), {
                    role: 'tablist',
                    'aria-label': words.columnsPanel,
                    onKeydown: (event: KeyboardEvent) => {
                        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                        const to = event.key === 'Home' ? TABS[0] : event.key === 'End' ? TABS[TABS.length - 1] : step ? TABS[(TABS.indexOf(view.tab) + step + TABS.length) % TABS.length] : null;
                        if (!to) return;
                        event.preventDefault();
                        on.drawerTab(to, true);
                    }
                }),
                TABS.map((tab) =>
                    h(
                        'button',
                        mergeAttrs({ key: tab, type: 'button' }, part('drawerTab', { active: view.tab === tab }), {
                            id: tabId(tab),
                            role: 'tab',
                            'aria-selected': view.tab === tab ? 'true' : 'false',
                            'aria-controls': panelId,
                            tabindex: view.tab === tab ? '0' : '-1',
                            'data-drawer-tab': tab,
                            onClick: () => on.drawerTab(tab, false)
                        }),
                        tabName[tab]
                    )
                )
            ),
            h(
                'div',
                mergeAttrs({ key: view.tab }, part('drawerContent'), { id: panelId, role: 'tabpanel', 'aria-labelledby': tabId(view.tab) }),
                view.tab === 'visible' ? visibleTab(context, view) : view.tab === 'organize' ? organizeTab(context, view) : valuesTab(context, view)
            ),
            h(
                'div',
                part('drawerFooter'),
                h('button', mergeAttrs({ type: 'button' }, part('drawerButton', { variant: 'outlined' }), { 'data-drawer-cancel': '', onClick: () => on.drawerCancel() }), words.drawerCancel),
                h('button', mergeAttrs({ type: 'button' }, part('drawerButton', {}), { 'data-drawer-apply': '', onClick: () => on.drawerApply() }), words.drawerApply)
            )
        )
    );
}
