import {
    createTypeahead,
    en,
    equals,
    firstIndex,
    getField,
    isPrintableKey,
    lastIndex,
    loadStyle,
    stepIndex,
    typeaheadIndex,
    type ClassEntry,
    type Locale
} from '@vitral/core';
import { createRoot, h, iconNode, mergeAttrs, partResolver, type Child, type PassThrough, type Props, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { baseStyle, selectStyle } from '@vitral/styles';
import { createOverlay, type Overlay, type OverlayTarget } from './overlay';

/**
 * A select with no framework in it: a button that says what is chosen and a
 * listbox that hangs from it. The button is the combobox — it keeps the
 * keyboard while the list is open and points at the option in hand through
 * `aria-activedescendant`, which is the pattern a screen reader expects and
 * the one every Vitral select uses.
 */

export interface SelectOption {
    label?: string;
    value?: unknown;
    disabled?: boolean;
    [key: string]: unknown;
}

export interface SelectConfig {
    /** The options: objects, or bare values that are their own label. */
    options?: readonly (SelectOption | string | number)[];
    /** The field holding an option's label. Defaults to `'label'`. */
    optionLabel?: string;
    /** The field holding an option's value; without it the option itself is the value. */
    optionValue?: string;
    /** The field that marks an option disabled. Defaults to `'disabled'`. */
    optionDisabled?: string;
    value?: unknown;
    placeholder?: string;
    disabled?: boolean;
    size?: 'small' | 'large';
    /** Fill the width it is given. */
    fluid?: boolean;
    invalid?: boolean;
    /** Names the control, where no label points at it. */
    ariaLabel?: string;
    ariaLabelledby?: string;
    /** Prefix of the ids it gives its elements; generated when unset. */
    id?: string;
    locale?: Locale;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** Where the list is put; the nearest overlay scope by default. */
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    nonce?: string;
    cssLayer?: string | false;
    onChange?: (value: unknown, option: SelectOption | string | number | undefined) => void;
    onOpen?: () => void;
    onClose?: () => void;
}

export interface SelectHandle {
    update(config: Partial<SelectConfig>): void;
    /** The value as it stands. */
    value(): unknown;
    open(): void;
    close(): void;
    focus(): void;
    destroy(): void;
    readonly element: HTMLElement;
}

interface Item {
    option: SelectOption | string | number;
    label: string;
    value: unknown;
    disabled: boolean;
    index: number;
}

let counter = 0;

export function createSelect(element: HTMLElement, config: SelectConfig = {}): SelectHandle {
    let current: SelectConfig = { ...config };
    let value = config.value;
    let active = -1;
    let trigger: HTMLElement | null = null;

    const id = config.id ?? `vt-select-${++counter}`;
    const listId = `${id}-list`;
    const optionId = (index: number) => `${id}-option-${index}`;
    const root = createRoot(element);
    const typeahead = createTypeahead();
    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: selectStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(selectStyle.name, selectStyle.css, options);
    }

    // ---- the options ------------------------------------------------------------------

    function items(): Item[] {
        return (current.options ?? []).map((option, index) => {
            const isObject = option !== null && typeof option === 'object';
            const label = isObject ? String(getField(option, current.optionLabel ?? 'label') ?? '') : String(option);
            const own = isObject && current.optionValue ? getField(option, current.optionValue) : option;
            return {
                option,
                label,
                value: isObject && !current.optionValue ? option : own,
                disabled: isObject ? !!getField(option, current.optionDisabled ?? 'disabled') : false,
                index
            };
        });
    }

    const chosen = (list: Item[]) => list.find((item) => equals(item.value, value));
    const disabledAt = (list: Item[]) => (index: number) => !!list[index]?.disabled;

    function choose(item: Item | undefined) {
        if (!item || item.disabled) return;
        const changed = !equals(item.value, value);
        value = item.value;
        overlay.close('request');
        render();
        trigger?.focus();
        if (changed) current.onChange?.(item.value, item.option);
    }

    // ---- the list ----------------------------------------------------------------------

    const overlay = createOverlay({
        anchor: () => trigger,
        render: () => listView(),
        placement: 'bottom-start',
        matchWidth: true,
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        inside: () => [element, overlay.element()],
        onOpen: () => {
            // A fresh list starts a fresh search: what was typed to find an
            // option while it was shut is not the start of the next word.
            typeahead.reset();
            const list = items();
            const selected = chosen(list);
            active = selected && !selected.disabled ? selected.index : firstIndex(list.length, disabledAt(list));
            overlay.update();
            render();
            current.onOpen?.();
        },
        onClose: () => {
            active = -1;
            typeahead.reset();
            render();
            current.onClose?.();
        }
    });

    function listView(): VElement {
        const list = items();
        const label = current.ariaLabelledby ? undefined : (current.ariaLabel ?? current.placeholder ?? locale().choose);
        return h(
            'div',
            mergeAttrs(part('overlay'), {
                // A press in the list must not take the keyboard off the combobox.
                onPointerdown: (event: PointerEvent) => event.pointerType !== 'touch' && event.preventDefault()
            }),
            list.length
                ? h(
                      'ul',
                      mergeAttrs({ id: listId, role: 'listbox' }, part('list'), { 'aria-label': label, 'aria-labelledby': current.ariaLabelledby }),
                      list.map((item) =>
                          h(
                              'li',
                              mergeAttrs({ key: item.index, id: optionId(item.index), role: 'option' }, part('option', { selected: equals(item.value, value), focused: active === item.index, disabled: item.disabled }), {
                                  'aria-selected': equals(item.value, value) ? 'true' : 'false',
                                  'aria-disabled': item.disabled ? 'true' : undefined,
                                  onClick: () => choose(item),
                                  onMousemove: () => {
                                      if (item.disabled || active === item.index) return;
                                      active = item.index;
                                      overlay.update();
                                  }
                              }),
                              h('span', part('optionLabel'), item.label),
                              equals(item.value, value) ? iconView('check', part('optionCheck')) : null
                          )
                      )
                  )
                : h('div', mergeAttrs({ role: 'status' }, part('empty')), locale().emptyMessage)
        ) as VElement;
    }

    // ---- the keyboard --------------------------------------------------------------------

    function move(step: 1 | -1) {
        const list = items();
        if (!overlay.isOpen) return overlay.open();
        active = stepIndex(list.length, active, step, disabledAt(list));
        overlay.update();
        render();
    }

    function onKeydown(event: KeyboardEvent) {
        if (current.disabled) return;
        const list = items();
        const focused = list[active];
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                move(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                move(-1);
                break;
            case 'Home':
                if (!overlay.isOpen) return;
                event.preventDefault();
                active = firstIndex(list.length, disabledAt(list));
                overlay.update();
                render();
                break;
            case 'End':
                if (!overlay.isOpen) return;
                event.preventDefault();
                active = lastIndex(list.length, disabledAt(list));
                overlay.update();
                render();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!overlay.isOpen) overlay.open();
                else if (focused) choose(focused);
                else overlay.close('request');
                break;
            case 'Tab':
                // The list is at the end of the document: tabbing on from it
                // would leave the page's order, so it takes what is in hand.
                if (overlay.isOpen) {
                    if (focused) choose(focused);
                    else overlay.close('request');
                }
                break;
            default:
                if (!isPrintableKey(event)) return;
                event.preventDefault();
                {
                    const query = typeahead.push(event.key);
                    const from = overlay.isOpen ? active : (chosen(list)?.index ?? -1);
                    const next = typeaheadIndex(list.map((item) => item.label), query, from, disabledAt(list), locale().code);
                    if (next < 0) return;
                    if (overlay.isOpen) {
                        active = next;
                        overlay.update();
                        render();
                    } else choose(list[next]);
                }
        }
    }

    // ---- drawing ---------------------------------------------------------------------------

    function render() {
        const list = items();
        const selected = chosen(list);
        const open = overlay.isOpen;
        root.attrs(
            mergeAttrs(
                part('root', {
                    open,
                    disabled: current.disabled,
                    invalid: current.invalid,
                    size: current.size,
                    fluid: current.fluid,
                    placeholder: !selected
                }),
                {
                    onClick: (event: MouseEvent) => {
                        if (current.disabled) return;
                        if (open) overlay.close('request');
                        else {
                            overlay.open();
                            (event.currentTarget as HTMLElement).querySelector<HTMLElement>('[role="combobox"]')?.focus();
                        }
                    }
                }
            )
        );
        root.render([
            h(
                'button',
                mergeAttrs({ key: 'trigger', type: 'button', role: 'combobox' }, part('label'), {
                    id,
                    disabled: current.disabled,
                    'aria-haspopup': 'listbox',
                    'aria-expanded': open ? 'true' : 'false',
                    'aria-controls': open && list.length ? listId : undefined,
                    'aria-activedescendant': open && active >= 0 ? optionId(active) : undefined,
                    'aria-label': current.ariaLabel,
                    'aria-labelledby': current.ariaLabelledby,
                    'aria-invalid': current.invalid ? 'true' : undefined,
                    ref: (el: Element | null) => (trigger = el as HTMLElement | null),
                    onKeydown,
                    // Space presses a button on keyup; the keydown already handled it.
                    onKeyup: (event: KeyboardEvent) => event.key === ' ' && event.preventDefault()
                }),
                selected ? selected.label : (current.placeholder ?? ' ')
            ),
            h('span', mergeAttrs({ key: 'dropdown', 'aria-hidden': 'true' }, part('dropdown')), iconView('chevronDown'))
        ]);
    }

    render();

    return {
        element,
        update(next) {
            current = { ...current, ...next };
            if ('value' in next) value = next.value;
            render();
            overlay.update();
        },
        value: () => value,
        open: () => overlay.open(),
        close: () => overlay.close('request'),
        focus: () => trigger?.focus(),
        destroy() {
            overlay.destroy();
            root.clear();
        }
    };
}

const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);
