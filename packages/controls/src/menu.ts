import { en, loadStyle, stepIndex, type ClassEntry, type Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, partResolver, type Child, type PassThrough, type Props, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { baseStyle, menuStyle } from '@vitral/styles';
import { createOverlay, type OverlayTarget } from './overlay';

/**
 * A menu of commands, hanging from the button that opened it. It follows the
 * APG menu button pattern: the menu itself takes the keyboard, the arrows walk
 * it, Enter and Space choose, Escape closes and puts the keyboard back on the
 * button. A separator is an item with no label.
 */

export interface MenuItem {
    label?: string;
    icon?: string;
    disabled?: boolean;
    /** A line between groups; everything else about the item is ignored. */
    separator?: boolean;
    /** What the item does. The menu closes first, so focus is where the reader left it. */
    onSelect?: () => void;
    [key: string]: unknown;
}

export interface MenuConfig {
    items?: readonly MenuItem[];
    /** Names the menu for a reader who cannot see what opened it. */
    ariaLabel?: string;
    ariaLabelledby?: string;
    id?: string;
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
    locale?: Locale;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    nonce?: string;
    cssLayer?: string | false;
    onOpen?: () => void;
    onClose?: () => void;
}

export interface MenuHandle {
    /** Opens it under `anchor`, and puts the keyboard on the first item (or the last). */
    open(anchor: HTMLElement, options?: { focusLast?: boolean }): void;
    close(): void;
    toggle(anchor: HTMLElement): void;
    update(config: Partial<MenuConfig>): void;
    readonly isOpen: boolean;
    destroy(): void;
}

let counter = 0;

export function createMenu(config: MenuConfig = {}): MenuHandle {
    let current: MenuConfig = { ...config };
    let anchor: HTMLElement | null = null;
    let active = -1;

    const id = config.id ?? `vt-menu-${++counter}`;
    const itemId = (index: number) => `${id}-item-${index}`;
    const locale = (): Locale => current.locale ?? en;
    // The menu wears the menu component's own classes, so a page with no
    // framework gets the menu the framework would have drawn.
    const part = partResolver({
        style: menuStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(menuStyle.name, menuStyle.css, options);
    }

    const disabledAt = (index: number) => !!current.items?.[index]?.disabled || !!current.items?.[index]?.separator;

    function choose(index: number) {
        const item = current.items?.[index];
        if (!item || item.disabled || item.separator) return;
        overlay.close('request');
        item.onSelect?.();
    }

    function move(step: 1 | -1) {
        const count = current.items?.length ?? 0;
        active = stepIndex(count, active, step, disabledAt, true);
        overlay.update();
        focusItem();
    }

    function focusItem() {
        overlay.element()?.querySelector<HTMLElement>(`#${cssEscape(itemId(active))}`)?.focus();
    }

    function onKeydown(event: KeyboardEvent) {
        const count = current.items?.length ?? 0;
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
                event.preventDefault();
                active = -1;
                move(1);
                break;
            case 'End':
                event.preventDefault();
                active = count;
                move(-1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                choose(active);
                break;
            case 'Tab':
                overlay.close('request');
                break;
        }
    }

    function menuView(): VElement {
        return h(
            'div',
            mergeAttrs({ id, role: 'menu' }, part('root', { popup: true }), {
                tabindex: '-1',
                'aria-label': current.ariaLabelledby ? undefined : (current.ariaLabel ?? locale().aria.moreOptions),
                'aria-labelledby': current.ariaLabelledby,
                onKeydown
            }),
            (current.items ?? []).map((item, index) =>
                item.separator
                    ? h('div', mergeAttrs({ key: index, role: 'separator' }, part('separator')))
                    : h(
                          'button',
                          mergeAttrs({ key: index, id: itemId(index), type: 'button', role: 'menuitem' }, part('item', { disabled: item.disabled, focused: active === index }), {
                              tabindex: active === index ? '0' : '-1',
                              disabled: item.disabled,
                              onClick: () => choose(index),
                              onMousemove: () => {
                                  if (item.disabled || active === index) return;
                                  active = index;
                                  overlay.update();
                              }
                          }),
                          item.icon ? iconView(item.icon, part('itemIcon')) : null,
                          h('span', part('itemLabel'), item.label ?? '')
                      )
            )
        ) as VElement;
    }

    const overlay = createOverlay({
        anchor: () => anchor,
        render: menuView,
        placement: current.placement ?? 'bottom-start',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        onOpen: () => {
            overlay.update();
            focusItem();
            current.onOpen?.();
        },
        onClose: (reason) => {
            active = -1;
            // Whatever closed it, the keyboard goes back to the button: the
            // menu had it, and there is nowhere else for it to be.
            if (reason !== 'outside') anchor?.focus();
            current.onClose?.();
        }
    });

    return {
        open(from, options = {}) {
            anchor = from;
            const count = current.items?.length ?? 0;
            active = options.focusLast ? stepIndex(count, count, -1, disabledAt, true) : stepIndex(count, -1, 1, disabledAt, true);
            overlay.open();
        },
        close: () => overlay.close('request'),
        toggle(from) {
            if (overlay.isOpen && anchor === from) overlay.close('request');
            else this.open(from);
        },
        update(next) {
            current = { ...current, ...next };
            overlay.update();
        },
        get isOpen() {
            return overlay.isOpen;
        },
        destroy: () => overlay.destroy()
    };
}

const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);

const cssEscape = (value: string): string => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&'));
