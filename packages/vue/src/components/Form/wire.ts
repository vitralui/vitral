import { camelize, cloneVNode, Fragment, isVNode, type Component, type VNode, type VNodeArrayChildren, type VNodeChild } from 'vue';

// How a field finds the control placed inside it and binds it, without the
// control knowing about forms: the field walks the vnodes its slot returned,
// finds the first control, and clones it with the value, the handler, the
// name, the invalid state and the ARIA relations added. A control inside
// another component's slot (an IconField, a FloatLabel) is found when that
// component renders the slot.

/** Vitral's value-holding components, by their component name. */
const CONTROLS = new Set([
    'VtInputText',
    'VtTextarea',
    'VtInputNumber',
    'VtInputMask',
    'VtInputOtp',
    'VtPassword',
    'VtSelect',
    'VtMultiSelect',
    'VtAutoComplete',
    'VtCascadeSelect',
    'VtTreeSelect',
    'VtListbox',
    'VtCheckbox',
    'VtRadioButton',
    'VtRadioGroup',
    'VtToggleSwitch',
    'VtToggleButton',
    'VtSelectButton',
    'VtSlider',
    'VtRating',
    'VtKnob',
    'VtColorPicker',
    'VtDatePicker',
    'VtEditor',
    'VtEditorRoot'
]);

/** Controls whose id lands on something a `<label for>` can name. */
const LABELABLE = new Set([
    'VtInputText',
    'VtTextarea',
    'VtInputNumber',
    'VtInputMask',
    'VtInputOtp',
    'VtPassword',
    'VtSelect',
    'VtMultiSelect',
    'VtAutoComplete',
    'VtCascadeSelect',
    'VtTreeSelect',
    'VtCheckbox',
    'VtToggleSwitch',
    'VtToggleButton',
    'VtColorPicker',
    'VtDatePicker'
]);

/** Controls whose role does not take `aria-required` (a group, a button). */
const NOT_REQUIRABLE = new Set(['VtSelectButton', 'VtToggleButton', 'VtInputOtp', 'VtColorPicker', 'VtRadioButton']);

/** Controls that take `invalid` for their look but do not tell assistive technology. */
const SILENT_INVALID = new Set(['VtSelectButton', 'VtToggleButton']);

/** Controls where a `name` attribute would land on something that is not a form control. */
const NO_NAME = new Set(['VtEditor', 'VtEditorRoot', 'VtListbox', 'VtSlider', 'VtKnob', 'VtRating', 'VtSelectButton']);

type ComponentType = Component & { name?: string; __name?: string; props?: unknown; vtFormControl?: boolean };

export function componentName(vnode: VNode): string | undefined {
    const type = vnode.type as ComponentType;
    if (!type || (typeof type !== 'object' && typeof type !== 'function')) return undefined;
    return type.name ?? type.__name;
}

function isComponent(vnode: VNode): boolean {
    return typeof vnode.type === 'object' || typeof vnode.type === 'function';
}

export function declaredProps(vnode: VNode): Set<string> {
    const props = (vnode.type as ComponentType).props;
    if (!props) return new Set();
    return new Set((Array.isArray(props) ? props : Object.keys(props as object)).map((key) => camelize(String(key))));
}

/** A prop the template gave, in either spelling. */
export function given(vnode: VNode, key: string): boolean {
    const props = vnode.props;
    if (!props) return false;
    if (key in props) return true;
    const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return kebab in props || camelize(key) in props;
}

export function givenValue(vnode: VNode, key: string): unknown {
    const props = vnode.props ?? {};
    return props[key] ?? props[camelize(key)] ?? props[key.replace(/([A-Z])/g, '-$1').toLowerCase()];
}

/**
 * Whether a component is a control: one of Vitral's, one that opts in with
 * `vtFormControl: true`, or — for components of your own — one with a
 * `modelValue` prop.
 */
export function isControl(vnode: VNode): boolean {
    if (!isComponent(vnode)) return false;
    const type = vnode.type as ComponentType;
    if (type.vtFormControl === false) return false;
    if (type.vtFormControl) return true;
    const name = componentName(vnode);
    if (name && CONTROLS.has(name)) return true;
    if (name?.startsWith('Vt')) return false;
    return declaredProps(vnode).has('modelValue');
}

/** One of several radios or checkboxes answering the same question. */
export function isGroupMember(vnode: VNode): boolean {
    const name = componentName(vnode);
    if (name === 'VtRadioButton') return true;
    return name === 'VtCheckbox' && given(vnode, 'value') && !givenValue(vnode, 'binary');
}

export function isLabelableControl(vnode: VNode): boolean {
    const name = componentName(vnode);
    if (!name) return true;
    if (name.startsWith('Vt')) return LABELABLE.has(name);
    return true;
}

export function takesRequired(vnode: VNode): boolean {
    return !NOT_REQUIRABLE.has(componentName(vnode) ?? '');
}

export function exposesInvalid(vnode: VNode): boolean {
    return !SILENT_INVALID.has(componentName(vnode) ?? '');
}

export function takesName(vnode: VNode): boolean {
    return !NO_NAME.has(componentName(vnode) ?? '');
}

/** Controls in the tree, in order — through elements and fragments, not into other components' slots. */
export function findControls(nodes: VNodeArrayChildren): VNode[] {
    const out: VNode[] = [];
    const visit = (node: VNodeChild) => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!isVNode(node)) return;
        if (isComponent(node)) {
            if (isControl(node)) out.push(node);
            return;
        }
        if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    nodes.forEach(visit);
    return out;
}

/** Whether a component appears in the tree (through elements and fragments). */
export function containsComponent(nodes: VNodeArrayChildren, type: unknown): boolean {
    const visit = (node: VNodeChild): boolean => {
        if (Array.isArray(node)) return node.some(visit);
        if (!isVNode(node)) return false;
        if (node.type === type) return true;
        return !isComponent(node) && Array.isArray(node.children) && node.children.some(visit);
    };
    return nodes.some(visit);
}

// A vnode made by a compiled template may be patched through its block's
// dynamic children, which still point at the originals; a node whose
// children were replaced has to be diffed in full.
const BAIL = -2;

function withChildren(node: VNode, children: VNodeArrayChildren): VNode {
    const copy = cloneVNode(node);
    copy.children = children;
    copy.patchFlag = BAIL;
    (copy as unknown as { dynamicChildren: unknown }).dynamicChildren = null;
    return copy;
}

/**
 * Rebuilds the tree with `replace` applied to controls. With `intoSlots`, a
 * component that is not a control has its slots wrapped so that the controls
 * they render are bound too, by `lazy`.
 */
export function mapControls(nodes: VNodeArrayChildren, replace: (vnode: VNode) => VNode | null, lazy?: (children: VNodeArrayChildren) => VNodeArrayChildren): VNodeArrayChildren {
    const visit = (node: VNodeChild): VNodeChild => {
        if (Array.isArray(node)) {
            const next = node.map(visit);
            return next.some((item, i) => item !== node[i]) ? (next as VNodeArrayChildren) : node;
        }
        if (!isVNode(node)) return node;
        if (isComponent(node)) {
            if (isControl(node)) return replace(node) ?? node;
            if (lazy && node.children && typeof node.children === 'object' && !Array.isArray(node.children)) {
                const slots = node.children as Record<string, unknown>;
                const wrapped: Record<string, unknown> = {};
                for (const [key, slot] of Object.entries(slots)) {
                    wrapped[key] = typeof slot === 'function' ? (...args: unknown[]) => lazy(normalize((slot as (...a: unknown[]) => VNodeChild)(...args))) : slot;
                }
                const copy = cloneVNode(node);
                copy.children = wrapped as VNode['children'];
                return copy;
            }
            return node;
        }
        if (node.type === Fragment || typeof node.type === 'string') {
            if (!Array.isArray(node.children)) return node;
            const next = node.children.map(visit);
            return next.some((item, i) => item !== (node.children as VNodeArrayChildren)[i]) ? withChildren(node, next as VNodeArrayChildren) : node;
        }
        return node;
    };
    return nodes.map(visit) as VNodeArrayChildren;
}

export function normalize(value: VNodeChild): VNodeArrayChildren {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

const TEXT_TYPES = new Set(['text', 'email', 'password', 'search', 'tel', 'url', 'number', '']);

/** Typing happens here: a text box, a text area, editable text. */
export function isTextEntry(el: EventTarget | Element | null | undefined): boolean {
    if (!el || !(el instanceof Element)) return false;
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLInputElement) return TEXT_TYPES.has(el.type);
    return (el as HTMLElement).isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox';
}

const LABELABLE_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS']);

export function isLabelableElement(el: Element | null): boolean {
    return !!el && LABELABLE_TAGS.has(el.tagName) && (el as HTMLInputElement).type !== 'hidden';
}

const FOCUSABLE = 'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** Focuses the control inside an element: the chosen radio, else the first thing that takes focus. */
export function focusInside(root: HTMLElement | null): boolean {
    if (!root) return false;
    const target =
        root.querySelector<HTMLElement>('input[type="radio"]:checked:not(:disabled)') ??
        Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).find((el) => !el.closest('[aria-hidden="true"]') && el.tabIndex >= 0) ??
        null;
    target?.focus();
    return !!target && root.ownerDocument.activeElement === target;
}
