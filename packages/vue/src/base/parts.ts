import { defineComponent, Fragment, type Component, type Slots, type VNode } from 'vue';

/**
 * The declarative half of a component's slots. An addon draws its own markup,
 * so what a template gives it is content: a cell, a card, a header, an empty
 * message. Those arrive as named slots — and, for a template that would rather
 * compose than remember slot names, as parts written as children:
 *
 * ```vue
 * <DataGrid :value="rows">
 *     <DataGrid.Column field="name" header="Name" />
 *     <DataGrid.Empty>Nothing here yet</DataGrid.Empty>
 * </DataGrid>
 * ```
 *
 * A part renders nothing. The component reads the vnodes in its default slot,
 * finds the parts by name and uses their children as the content — which is
 * how `<Column>` has always worked.
 */

/** The marker a part carries, and the component reads. */
export const PART_NAME = '__vtPart';

export type PartComponent = Component & { [PART_NAME]: string };

/**
 * A component that draws nothing and stands for one piece of content. `name`
 * is what the parent looks for; the component is named `Vt<Name>` so it is
 * recognisable in the devtools and in a warning.
 */
export function definePart(name: string, componentName = `Vt${name}`): PartComponent {
    const component = defineComponent({
        name: componentName,
        // Nothing is drawn here: the parent takes the children and places them.
        setup: () => () => null
    });
    return Object.assign(component, { [PART_NAME]: name }) as PartComponent;
}

const partOf = (vnode: VNode): string | undefined => (vnode.type as Partial<PartComponent> | null)?.[PART_NAME];

/**
 * Walks what a default slot gave and collects the parts in it, by name, with
 * the slots each one carries. A fragment (`v-for`, `v-if`, a template) is
 * walked through; anything else is handed to `other`, which is how a table
 * picks its columns out of the same pass.
 */
export function collectParts(nodes: unknown, out: Map<string, Slots>, other?: (vnode: VNode) => void): void {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
        if (Array.isArray(node)) collectParts(node, out, other);
        else if (node && typeof node === 'object') {
            const vnode = node as VNode;
            const name = partOf(vnode);
            if (name) {
                const children = vnode.children;
                out.set(name, (children && typeof children === 'object' && !Array.isArray(children) ? children : {}) as Slots);
            } else if (vnode.type === Fragment) collectParts(vnode.children, out, other);
            else other?.(vnode);
        }
    }
}

/**
 * One content function from a named slot or the part that stands for it, in
 * that order: a template that gives both meant the slot.
 */
export function contentOf(slots: Slots, name: string, parts: Map<string, Slots>, part: string): ((data?: unknown) => unknown) | undefined {
    const own = slots[name];
    if (own) return own as (data?: unknown) => unknown;
    const inside = parts.get(part)?.default;
    return inside ? (data?: unknown) => inside(data) : undefined;
}
