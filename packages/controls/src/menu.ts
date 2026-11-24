import { en, loadStyle, stepIndex, type ClassEntry, type Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, partResolver, type Child, type PassThrough, type Props, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { baseStyle, menuStyle, tieredmenuStyle } from '@vitral/styles';
import { createOverlay, type OverlayTarget } from './overlay';

/**
 * A menu of commands, hanging from the button that opened it. It follows the
 * APG menu button pattern: the menu itself takes the keyboard, the arrows walk
 * it, Enter and Space choose, Escape closes and puts the keyboard back on the
 * button. A separator is an item with no label.
 *
 * An item with `items` of its own opens them beside it, as TieredMenu does and
 * in its classes: the right arrow, Enter or the pointer opens it, the left
 * arrow or Escape goes back. An item with `checked` is one of a choice, ticked
 * when it is the one chosen.
 */

export interface MenuItem {
    label?: string;
    icon?: string;
    disabled?: boolean;
    /** A line between groups; everything else about the item is ignored. */
    separator?: boolean;
    /** What the item does. The menu closes first, so focus is where the reader left it. */
    onSelect?: () => void;
    /** Items opened beside this one: a submenu. */
    items?: readonly MenuItem[];
    /** One of a choice: ticked when true, and announced as a radio item either way. */
    checked?: boolean;
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
    // The item with the keyboard, as its place at each level: [2] is the third item, [2, 0] the first in its submenu.
    let path: number[] = [];
    // The pointer opened the last item's submenu without going into it.
    let peek = false;

    const id = config.id ?? `vt-menu-${++counter}`;
    const itemId = (at: number[]) => `${id}-item-${at.join('-')}`;
    const locale = (): Locale => current.locale ?? en;
    const resolver = (style: typeof menuStyle | typeof tieredmenuStyle) =>
        partResolver({
            style,
            unstyled: () => !!current.unstyled,
            classes: () => current.classes,
            pt: () => current.pt,
            props: () => current as Record<string, unknown>
        });
    // The menu wears the menu component's own classes, so a page with no
    // framework gets the menu the framework would have drawn — TieredMenu's, once it has submenus.
    const flatPart = resolver(menuStyle);
    const nestedPart = resolver(tieredmenuStyle);
    const nested = () => (current.items ?? []).some((item) => !!item.items?.length);

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(menuStyle.name, menuStyle.css, options);
        loadStyle(tieredmenuStyle.name, tieredmenuStyle.css, options);
    }

    /** The items at a level of the path: the root's, or the submenu of the item before it. */
    function itemsAt(depth: number): readonly MenuItem[] {
        let items = current.items ?? [];
        for (let level = 0; level < depth; level++) items = items[path[level]!]?.items ?? [];
        return items;
    }
    const skip = (items: readonly MenuItem[]) => (index: number) => !!items[index]?.disabled || !!items[index]?.separator;
    const firstOf = (items: readonly MenuItem[]) => stepIndex(items.length, -1, 1, skip(items), true);

    function choose(at: number[]) {
        const item = itemAt(at);
        if (!item || item.disabled || item.separator) return;
        if (item.items?.length) {
            path = [...at, firstOf(item.items)];
            peek = false;
            redraw();
            return;
        }
        overlay.close('request');
        item.onSelect?.();
    }

    function itemAt(at: number[]): MenuItem | undefined {
        let items = current.items ?? [];
        let item: MenuItem | undefined;
        for (const index of at) {
            item = items[index];
            items = item?.items ?? [];
        }
        return item;
    }

    function move(step: 1 | -1, from?: number) {
        const depth = path.length - 1;
        const items = itemsAt(depth);
        path = [...path.slice(0, depth), stepIndex(items.length, from ?? path[depth] ?? -1, step, skip(items), true)];
        peek = false;
        redraw();
    }

    function back() {
        if (path.length < 2) return false;
        path = path.slice(0, -1);
        peek = false;
        redraw();
        return true;
    }

    function redraw() {
        overlay.update();
        placeSubmenus();
        focusItem();
    }

    function focusItem() {
        overlay.element()?.querySelector<HTMLElement>(`#${cssEscape(itemId(path))}`)?.focus();
    }

    // A submenu stands beside its item, on the side with room for it; position: fixed, so no ancestor clips it.
    function placeSubmenus() {
        const panel = overlay.element();
        if (!panel) return;
        for (const submenu of Array.from(panel.querySelectorAll<HTMLElement>('[data-submenu]'))) {
            const item = submenu.parentElement!.getBoundingClientRect();
            const own = submenu.getBoundingClientRect();
            const width = typeof window !== 'undefined' ? window.innerWidth : 0;
            const height = typeof window !== 'undefined' ? window.innerHeight : 0;
            const rtl = getComputedStyle(submenu).direction === 'rtl';
            const after = rtl ? item.left - own.width : item.right;
            const before = rtl ? item.right : item.left - own.width;
            const fitsAfter = rtl ? after >= 0 : after + own.width <= width;
            submenu.style.left = `${Math.max(0, fitsAfter ? after : before)}px`;
            submenu.style.top = `${Math.max(0, Math.min(item.top, height - own.height))}px`;
        }
    }

    function onKeydown(event: KeyboardEvent) {
        const depth = path.length - 1;
        const items = itemsAt(depth);
        const rtl = (event.currentTarget as HTMLElement | null)?.matches?.(':dir(rtl)') ?? false;
        const [forward, backward] = rtl ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
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
                move(1, -1);
                break;
            case 'End':
                event.preventDefault();
                move(-1, items.length);
                break;
            case forward:
                if (itemAt(path)?.items?.length) {
                    event.preventDefault();
                    choose(path);
                }
                break;
            case backward:
                if (back()) event.preventDefault();
                break;
            case 'Escape':
                // Out of a submenu, Escape goes back a level; out of the menu, the overlay closes it.
                if (back()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                choose(path);
                break;
            case 'Tab':
                overlay.close('request');
                break;
        }
    }

    // When some items of a list carry an icon or a tick, the others keep the room for one, so the labels line up.
    const padded = (items: readonly MenuItem[]) => items.some((item) => !!item.icon || item.checked !== undefined);

    function itemView(item: MenuItem, at: number[], depth: number, tiered: boolean, pad = false): Child {
        const part = tiered ? nestedPart : flatPart;
        const key = at[at.length - 1]!;
        if (item.separator) return h('div', mergeAttrs({ key, role: 'separator' }, part('separator')));
        const focused = path.length === at.length && at.every((index, level) => path[level] === index);
        const onPath = at.every((index, level) => path[level] === index);
        const children = item.items?.length ? item.items : null;
        const expanded = !!children && onPath && (path.length > at.length || peek);
        const choice = item.checked !== undefined;
        return h(
            'div',
            mergeAttrs({ key, role: 'none' }, part('item', { disabled: item.disabled, focused, active: expanded, parent: !!children, level: depth })),
            h(
                'button',
                mergeAttrs({ id: itemId(at), type: 'button', role: choice ? 'menuitemradio' : 'menuitem' }, part('itemContent'), {
                    tabindex: focused ? '0' : '-1',
                    disabled: item.disabled,
                    'aria-haspopup': children ? 'menu' : undefined,
                    'aria-expanded': children ? String(expanded) : undefined,
                    'aria-checked': choice ? String(!!item.checked) : undefined,
                    onClick: () => choose(at),
                    onMousemove: () => {
                        if (item.disabled || (focused && (peek || !children))) return;
                        path = at;
                        peek = !!children;
                        redraw();
                    }
                }),
                // A choice keeps a tick's room whether it is ticked or not, so the labels line up.
                choice
                    ? iconView('check', mergeAttrs(part('itemIcon'), { style: item.checked ? undefined : { visibility: 'hidden' } }))
                    : item.icon
                      ? iconView(item.icon, part('itemIcon'))
                      : pad
                        ? iconView('check', mergeAttrs(part('itemIcon'), { style: { visibility: 'hidden' } }))
                        : null,
                h('span', part('itemLabel'), item.label ?? ''),
                children ? iconView('chevronRight', part('submenuIcon')) : null
            ),
            expanded
                ? h(
                      'div',
                      mergeAttrs({ role: 'menu', 'data-submenu': '' }, part('submenu'), { 'aria-label': item.label, style: { zIndex: 1 } }),
                      children!.map((child, index) => itemView(child, [...at, index], depth + 1, tiered, padded(children!)))
                  )
                : null
        );
    }

    function menuView(): VElement {
        const tiered = nested();
        const part = tiered ? nestedPart : flatPart;
        return h(
            'div',
            mergeAttrs({ id, role: 'menu' }, part('root', { popup: true }), {
                tabindex: '-1',
                'aria-label': current.ariaLabelledby ? undefined : (current.ariaLabel ?? locale().aria.moreOptions),
                'aria-labelledby': current.ariaLabelledby,
                onKeydown
            }),
            // The menu component's own build — a list, an item, the item's content —
            // so its stylesheet draws this one; the wrappers are no part of the menu's ARIA.
            h(
                'div',
                mergeAttrs(part(tiered ? 'rootList' : 'list'), { role: 'none' }),
                (current.items ?? []).map((item, index) => itemView(item, [index], 0, tiered, padded(current.items ?? [])))
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
            path = [];
            peek = false;
            // Whatever closed it, the keyboard goes back to the button: the
            // menu had it, and there is nowhere else for it to be.
            if (reason !== 'outside') anchor?.focus();
            current.onClose?.();
        }
    });

    return {
        open(from, options = {}) {
            anchor = from;
            const items = current.items ?? [];
            path = [options.focusLast ? stepIndex(items.length, items.length, -1, skip(items), true) : firstOf(items)];
            peek = false;
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
            placeSubmenus();
        },
        get isOpen() {
            return overlay.isOpen;
        },
        destroy: () => overlay.destroy()
    };
}

const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);

const cssEscape = (value: string): string => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&'));
