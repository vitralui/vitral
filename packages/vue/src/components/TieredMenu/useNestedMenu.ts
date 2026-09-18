import {
    createTypeahead,
    hasSubmenu,
    isMenuOpen,
    isPrintableKey,
    menuItemAt,
    menuKeyAction,
    menuLevel,
    pushLayer,
    typeaheadIndex,
    type MenuNavState,
    type MenuTreeAccess
} from '@vitral/core';
import { computed, h, mergeProps, nextTick, onBeforeUnmount, ref, watch, type Component, type VNode, type VNodeArrayChildren } from 'vue';
import { useAnchored } from '../../base/anchored';
import type { PassThroughAttrs } from '../../base/types';
import Icon from '../Icon/Icon.vue';
import type { MenuItem } from '../Menu/types';

// The part every nested menu shares — TieredMenu, ContextMenu and Menubar:
// the model as the reader sees it, where focus is (core's MenuNavState), the
// WAI-ARIA menu and menubar keys (core's menuKeyAction), the pointer, and the
// rendering of menuitems and their submenus. Each component brings its own
// stylesheet under the same part names, and decides what "closing" means.

export interface NestedMenuOptions {
    model: () => readonly MenuItem[];
    /** The top level is a menubar. */
    horizontal: () => boolean;
    part: (name: string, state?: unknown) => PassThroughAttrs;
    idPrefix: string;
    locale: () => string;
    /** Leave the whole menu: Escape at the top, Tab, or a command run. */
    onClose?: (returnFocus: boolean) => void;
    /** A submenu opens on hover straight away; a menubar waits until it has been opened once. */
    hoverOpens?: () => boolean;
    /** Submenus nest in the flow instead of floating beside their item — a menubar's small-screen column. */
    inline?: () => boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemSlot?: () => ((props: any) => unknown) | undefined;
}

const shown = (item: MenuItem) => item.visible !== false;

export function useNestedMenu(options: NestedMenuOptions) {
    const nav = ref<MenuNavState>({ path: [], expanded: false });
    const engaged = ref(false);
    const hasFocus = ref(false);
    const typeahead = createTypeahead();
    const anchored = useAnchored('menu');

    const visibleChildren = (item: MenuItem) => (item.items ? item.items.filter(shown) : undefined);
    const access: MenuTreeAccess<MenuItem> = { children: visibleChildren, skip: (item) => !!item.separator || !!item.disabled };
    const roots = computed(() => options.model().filter(shown));

    const idOf = (path: readonly number[]) => `${options.idPrefix}-item-${path.join('_')}`;
    const pathOf = (el: Element | null): number[] | null => {
        const value = el?.closest<HTMLElement>('[data-vt-path]')?.dataset.vtPath;
        return value === undefined ? null : value.split('_').map(Number);
    };

    /** The top-level item in the tab order: the last focused, else the first enabled. */
    const tabStop = computed(() => {
        const current = nav.value.path[0];
        if (current !== undefined && roots.value[current] && !access.skip!(roots.value[current]!)) return current;
        return roots.value.findIndex((item) => !access.skip!(item));
    });

    function focusPath(path: readonly number[]) {
        nextTick(() => document.getElementById(idOf(path))?.focus());
    }

    function moveTo(state: MenuNavState, focus = true) {
        nav.value = state;
        if (state.path.length > 1 || state.expanded) engaged.value = true;
        if (focus && state.path.length) focusPath(state.path);
    }

    /** Closes every submenu, keeping the top-level position. */
    function collapse() {
        nav.value = { path: nav.value.path.slice(0, 1), expanded: false };
        engaged.value = false;
    }

    function reset() {
        nav.value = { path: [], expanded: false };
        engaged.value = false;
        typeahead.reset();
    }

    function activate(path: readonly number[], event: Event) {
        const item = menuItemAt(roots.value, path, access);
        if (!item || item.disabled || item.separator) return;
        if (hasSubmenu(item, access)) {
            const open = isMenuOpen(nav.value, path);
            moveTo({ path: [...path], expanded: !open }, false);
            if (!open) engaged.value = true;
            return;
        }
        item.command?.({ originalEvent: event, item });
        collapse();
        options.onClose?.(true);
    }

    // A press outside closes the open submenus.
    let releaseLayer: (() => void) | null = null;
    let rootEl: HTMLElement | null = null;
    const anyOpen = computed(() => nav.value.path.length > 1 || nav.value.expanded);
    watch(anyOpen, (open) => {
        releaseLayer?.();
        releaseLayer = open ? pushLayer({ elements: () => [rootEl], onPointerDownOutside: () => collapse() }) : null;
    });
    onBeforeUnmount(() => releaseLayer?.());

    function onKeydown(event: KeyboardEvent) {
        const from = pathOf(event.target as Element) ?? nav.value.path;
        const state: MenuNavState = { path: from, expanded: nav.value.expanded && from.join() === nav.value.path.join() };
        if (event.key === 'Tab') {
            collapse();
            options.onClose?.(false);
            return;
        }
        const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
        const result = menuKeyAction(roots.value, state, event.key, access, { horizontal: options.horizontal(), rtl });
        switch (result.type) {
            case 'move':
                event.preventDefault();
                event.stopPropagation();
                moveTo(result.state);
                return;
            case 'activate': {
                event.preventDefault();
                // A link follows its href on click; a command runs on click. One path for both.
                const el = document.getElementById(idOf(result.state.path));
                if (el) el.click();
                return;
            }
            case 'close':
                if (options.onClose) {
                    event.preventDefault();
                    event.stopPropagation();
                    options.onClose(true);
                }
                return;
        }
        if (isPrintableKey(event)) {
            const level = menuLevel(roots.value, from, from.length - 1, access);
            const labels = level.map((item) => (item.separator ? '' : (item.label ?? '')));
            const index = typeaheadIndex(labels, typeahead.push(event.key), from[from.length - 1] ?? -1, (i) => access.skip!(level[i]!), options.locale());
            if (index >= 0) {
                event.preventDefault();
                moveTo({ path: [...from.slice(0, -1), index], expanded: false });
            }
        }
    }

    function onFocusin(event: FocusEvent) {
        hasFocus.value = true;
        const path = pathOf(event.target as Element);
        if (path && path.join() !== nav.value.path.join()) nav.value = { path, expanded: false };
    }

    function onFocusout(event: FocusEvent) {
        const next = event.relatedTarget as Node | null;
        if (!next || !(event.currentTarget as HTMLElement).contains(next)) {
            hasFocus.value = false;
            if (next) collapse();
        }
    }

    function onItemHover(path: number[], item: MenuItem) {
        if (item.disabled || item.separator) return;
        const opensOnHover = options.hoverOpens?.() ?? true;
        if (!opensOnHover && !engaged.value) return;
        // Keep focus where the keyboard left it unless the menu already has it.
        nav.value = { path, expanded: hasSubmenu(item, access) };
        if (hasFocus.value) document.getElementById(idOf(path))?.focus({ preventScroll: true });
    }

    function setRoot(el: HTMLElement | null) {
        rootEl = el;
    }

    // ---- rendering ----------------------------------------------------------------

    const IconComponent = Icon as unknown as Component;

    /** A menubar's first submenus drop below the bar; every other one opens beside its item. */
    function placementOf(level: number) {
        if (level === 0 || options.inline?.()) return false;
        if (level === 1 && options.horizontal()) return { placement: 'bottom-start' as const, offset: 4 };
        return { placement: 'right-start' as const, offset: 0, alignFirstItem: true };
    }

    function renderList(list: readonly MenuItem[], trail: number[], attrs: Record<string, unknown>): VNode {
        const level = trail.length;
        return h(
            'ul',
            // One set of listeners, on the top list: key and focus events from submenus bubble up to it.
            mergeProps(options.part(level === 0 ? 'rootList' : 'submenu', { level }), attrs, level === 0 ? { onKeydown, onFocusin, onFocusout } : anchored.hooks(placementOf(level))),
            list.map((item, index) => renderItem(item, [...trail, index]))
        );
    }

    function renderItem(item: MenuItem, path: number[]): VNode {
        const key = item.key ?? path.join('_');
        if (item.separator) return h('li', mergeProps(options.part('separator'), { key, role: 'separator' }));
        const level = path.length - 1;
        const children = visibleChildren(item) ?? [];
        const parent = hasSubmenu(item, access);
        const open = parent && isMenuOpen(nav.value, path);
        const focused = hasFocus.value && nav.value.path.join() === path.join();
        const tabbable = level === 0 && path[0] === tabStop.value;
        const link = !!item.url && !parent;
        const state = { disabled: !!item.disabled, focused, active: open, level, parent };
        const slot = options.itemSlot?.();
        const horizontal = options.horizontal() && level === 0;
        const content: VNodeArrayChildren = slot
            ? (slot({ item, label: item.label, focused, disabled: !!item.disabled, hasSubmenu: parent, open }) as VNodeArrayChildren)
            : [
                  item.icon ? h(IconComponent, mergeProps(options.part('itemIcon', state), { icon: item.icon })) : null,
                  h('span', options.part('itemLabel', state), item.label),
                  parent ? h(IconComponent, mergeProps(options.part('submenuIcon', state), { icon: horizontal ? 'chevronDown' : 'chevronRight' })) : null
              ];
        return h('li', mergeProps(options.part('item', state), { key, role: 'none', class: item.class as string }), [
            h(
                link ? 'a' : 'div',
                mergeProps(options.part('itemContent', state), {
                    id: idOf(path),
                    'data-vt-path': path.join('_'),
                    role: 'menuitem',
                    tabindex: tabbable ? 0 : -1,
                    href: link && !item.disabled ? item.url : undefined,
                    target: link ? item.target : undefined,
                    'aria-disabled': item.disabled ? 'true' : undefined,
                    'aria-haspopup': parent ? 'menu' : undefined,
                    'aria-expanded': parent ? (open ? 'true' : 'false') : undefined,
                    'aria-controls': open ? `${idOf(path)}-menu` : undefined,
                    onClick: (event: MouseEvent) => {
                        if (item.disabled) event.preventDefault();
                        else activate(path, event);
                    },
                    onMouseenter: () => onItemHover(path, item)
                }),
                content
            ),
            open ? renderList(children, path, { id: `${idOf(path)}-menu`, role: 'menu', 'aria-labelledby': idOf(path) }) : null
        ]);
    }

    return { nav, roots, access, engaged, hasFocus, tabStop, idOf, focusPath, moveTo, collapse, reset, activate, renderList, setRoot, onKeydown };
}
