<script setup lang="ts">
import { required as requiredRule, type FieldOptions, type Rule } from '@vitral/forms';
import { formStyle } from '@vitral/styles';
import { cloneVNode, computed, h, mergeProps, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, useId, watch, type VNode, type VNodeArrayChildren } from 'vue';
import { useComponent } from '../../base/useComponent';
import { AUTO_PARTS, FieldKey, inheritRoot, useFormContext, type FieldContext } from './context';
import FormDescription from './FormDescription.vue';
import FormLabel from './FormLabel.vue';
import FormMessage from './FormMessage.vue';
import type { FormFieldControlProps, FormFieldProps, FormFieldSlotProps, FormFieldSlots } from './types';
import {
    componentName,
    containsComponent,
    declaredProps,
    exposesInvalid,
    findControls,
    focusInside,
    given,
    givenValue,
    isGroupMember,
    isLabelableControl,
    isLabelableElement,
    isTextEntry,
    mapControls,
    normalize,
    takesName,
    takesRequired
} from './wire';

// One value of the form. The field registers its path and rules, renders its
// label, hint and error (or lets you place them), and binds the control put
// inside it: the value both ways, the name, the invalid state, and the ARIA
// that ties the control to its label, hint and error. Radios or checkboxes
// placed side by side answer one question together; the field becomes their
// group.

defineOptions({ name: 'VtFormField' });

const props = withDefaults(defineProps<FormFieldProps>(), { unstyled: undefined, required: false, message: true, autoBind: true });
const slots = defineSlots<FormFieldSlots>();
const form = useFormContext('FormField');
const styled = inheritRoot(props, form);
const { part } = useComponent(formStyle, styled);
const uid = useId();

const rootRef = ref<HTMLElement | null>(null);
const explicitId = ref<string>();
const labelable = ref(true);
const group = ref(false);
const groupKind = ref<'radio' | 'checkbox'>('radio');
const parts = reactive({ label: 0, description: 0, message: 0 });
/** What the last render found inside, for the attributes that point at it. */
const layout = reactive({ hasLabel: false, hasDescription: false, hasMessage: true });
const labelElements = new Set<() => HTMLElement | null>();
let control: { focus?: () => void } | null = null;
let lastControl: string | undefined;
const requiredCheck = requiredRule();

const ids = {
    get control() {
        return explicitId.value ?? props.id ?? `${uid}-control`;
    },
    label: `${uid}-label`,
    description: `${uid}-description`,
    message: `${uid}-message`
};

const state = computed(() => form.fieldState(props.name));
const quiet = computed(() => form.quiet.value.has(props.name));
const relation = computed(() => form.errorRelation.value);

// ------------------------------------------------------------ registration

function visibleText(el: Element | null | undefined): string {
    if (!el) return '';
    let text = '';
    const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? '';
        else if (node instanceof Element && node.getAttribute('aria-hidden') !== 'true') node.childNodes.forEach(walk);
    };
    walk(el);
    return text.replace(/\s+/g, ' ').trim();
}

function labelText(): string {
    if (props.label) return props.label;
    for (const get of labelElements) {
        const text = visibleText(get());
        if (text) return text;
    }
    const root = rootRef.value;
    const target = root?.ownerDocument.getElementById(ids.control);
    if (target && root?.contains(target)) {
        const labels = (target as HTMLInputElement).labels;
        if (labels?.length) return visibleText(labels[0]);
        const aria = target.getAttribute('aria-label');
        if (aria) return aria;
    }
    return '';
}

const rules = computed<Rule[]>(() => {
    const own = props.rules === undefined ? [] : Array.isArray(props.rules) ? props.rules : [props.rules];
    return [...(props.required ? [requiredCheck] : []), ...(own as Rule[])];
});

const options = computed<FieldOptions>(() => ({
    rules: rules.value,
    validateOn: props.validateOn,
    revalidateOn: props.revalidateOn,
    debounce: props.debounce,
    deps: props.deps,
    label: labelText,
    initialValue: props.initialValue
}));

let registration = form.form.register(props.name, options.value);
watch(options, (next) => registration.update(next));
watch(
    () => props.name,
    (name) => {
        registration.unregister();
        registration = form.form.register(name, options.value);
    }
);
const unregisterEntry = form.registerEntry({ name: () => props.name, element: () => rootRef.value, controlId: () => ids.control, label: labelText, focus });

// ------------------------------------------------------------ interaction

function report(error: unknown) {
    console.error(error);
}

function setValue(value: unknown, trigger: 'input' | 'change' = 'change') {
    form.release(props.name);
    form.form.setValue(props.name, value, { trigger });
}

function onControlUpdate(value: unknown) {
    const root = rootRef.value;
    const active = root?.ownerDocument.activeElement;
    setValue(value, root && active && root.contains(active) && isTextEntry(active) ? 'input' : 'change');
}

/** Whether focus at `el` is still "in" the field: inside it, or in a popup its control opened. */
function owns(el: Element | null | undefined): boolean {
    const root = rootRef.value;
    if (!root || !el) return false;
    if (root.contains(el)) return true;
    const doc = root.ownerDocument;
    for (const owner of Array.from(root.querySelectorAll('[aria-controls], [aria-owns]'))) {
        const refs = `${owner.getAttribute('aria-controls') ?? ''} ${owner.getAttribute('aria-owns') ?? ''}`.split(/\s+/);
        for (const id of refs) if (id && doc.getElementById(id)?.contains(el)) return true;
    }
    const popup = el.closest('.vt-overlay, [role="dialog"], [role="listbox"], [role="tree"], [role="menu"]');
    return !!popup && !popup.contains(root) && popup.getAttribute('aria-modal') !== 'true';
}

let watching: ((event: FocusEvent) => void) | null = null;

function stopWatching() {
    if (!watching) return;
    rootRef.value?.ownerDocument.removeEventListener('focusin', watching, true);
    watching = null;
}

// Focus went into a popup of the control: the field is left only when focus goes somewhere else.
function watchFocus() {
    const doc = rootRef.value?.ownerDocument;
    if (watching || !doc) return;
    watching = (event) => {
        const target = event.target as Element | null;
        if (owns(target)) {
            if (rootRef.value?.contains(target)) stopWatching();
            return;
        }
        stopWatching();
        blur();
    };
    doc.addEventListener('focusin', watching, true);
}

function blur() {
    form.release(props.name);
    void form.form.blur(props.name)?.catch(report);
}

function onFocusout(event: FocusEvent) {
    const root = rootRef.value;
    if (!root) return;
    const next = event.relatedTarget as Element | null;
    if (next) {
        if (!owns(next)) blur();
        else if (!root.contains(next)) watchFocus();
        return;
    }
    // Focus went nowhere we can see yet (a popup still opening, the window losing focus): look again shortly.
    setTimeout(() => {
        const active = root.ownerDocument.activeElement;
        if (active && active !== root.ownerDocument.body && owns(active)) {
            if (!root.contains(active)) watchFocus();
            return;
        }
        if (root.ownerDocument.hasFocus?.() === false && active && root.contains(active)) return;
        blur();
    });
}

// A text box reports its value on every keystroke; its native change marks the edit as committed.
function onNativeChange(event: Event) {
    if (!isTextEntry(event.target)) return;
    form.release(props.name);
    void form.form.commit(props.name)?.catch(report);
}

function focus() {
    const root = rootRef.value;
    if (!root) return;
    const doc = root.ownerDocument;
    const settled = () => doc.activeElement !== doc.body && owns(doc.activeElement);
    if (!group.value && control?.focus) {
        control.focus();
        if (settled()) return;
    }
    const target = doc.getElementById(ids.control);
    if (!group.value && target && root.contains(target) && (isLabelableElement(target) || target.tabIndex >= 0)) {
        target.focus();
        if (doc.activeElement === target) return;
    }
    focusInside(root);
}

// ------------------------------------------------------------ binding

function describedBy(extra?: unknown): string | undefined {
    const invalid = state.value.invalid;
    const list = [extra, layout.hasDescription && ids.description, invalid && layout.hasMessage && relation.value !== 'errormessage' && ids.message];
    return list.filter(Boolean).join(' ') || undefined;
}

function bind(vnode: VNode, member: boolean): VNode {
    const snapshot = state.value;
    const declared = declaredProps(vnode);
    const extra: Record<string, unknown> = {};
    if (!given(vnode, 'modelValue')) extra.modelValue = snapshot.value;
    extra['onUpdate:modelValue'] = onControlUpdate;
    if (declared.has('invalid') && !given(vnode, 'invalid')) extra.invalid = snapshot.invalid;
    if (snapshot.invalid && !member && (!declared.has('invalid') || !exposesInvalid(vnode))) extra['aria-invalid'] = 'true';
    if (form.disabled.value && declared.has('disabled') && !given(vnode, 'disabled')) extra.disabled = true;
    if (takesName(vnode) && !given(vnode, 'name')) extra.name = props.name;
    if (!member) {
        if (!given(vnode, 'id')) extra.id = ids.control;
        extra['aria-describedby'] = describedBy(givenValue(vnode, 'aria-describedby'));
        if (snapshot.invalid && layout.hasMessage && relation.value !== 'describedby' && !given(vnode, 'aria-errormessage')) extra['aria-errormessage'] = ids.message;
        if (layout.hasLabel && !labelable.value && !given(vnode, 'aria-labelledby') && !given(vnode, 'aria-label')) extra['aria-labelledby'] = ids.label;
        if (snapshot.required && takesRequired(vnode) && !given(vnode, 'aria-required')) extra['aria-required'] = 'true';
        extra.ref = (instance: unknown) => {
            control = (instance as { focus?: () => void } | null) ?? null;
        };
    }
    return cloneVNode(vnode, extra, true);
}

function note(controls: VNode[]): { group: boolean; first?: VNode } {
    const members = controls.filter(isGroupMember);
    const isGroup = members.length > 1 && members.length === controls.length;
    if (group.value !== isGroup) group.value = isGroup;
    if (isGroup) {
        const kind = componentName(members[0]!) === 'VtRadioButton' ? 'radio' : 'checkbox';
        if (groupKind.value !== kind) groupKind.value = kind;
        if (explicitId.value !== undefined) explicitId.value = undefined;
        return { group: true };
    }
    const first = controls[0];
    if (first) {
        const id = givenValue(first, 'id') as string | undefined;
        if (explicitId.value !== id) explicitId.value = id;
        const name = componentName(first);
        // A first guess from the kind of control, checked against the page once it is there.
        if (name !== lastControl) {
            lastControl = name;
            const guess = isLabelableControl(first);
            if (labelable.value !== guess) labelable.value = guess;
        }
    }
    return { group: false, first };
}

function wire(nodes: VNodeArrayChildren, controls: VNode[]): VNodeArrayChildren {
    const found = note(controls);
    return mapControls(nodes, (vnode) => (found.group ? (isGroupMember(vnode) ? bind(vnode, true) : null) : vnode === found.first ? bind(vnode, false) : null));
}

/** Controls rendered in another component's slot are bound when that slot renders. */
function wireLater(nodes: VNodeArrayChildren): VNodeArrayChildren {
    const controls = findControls(nodes);
    return controls.length ? wire(nodes, controls) : mapControls(nodes, () => null, wireLater);
}

function checkLabelable() {
    const root = rootRef.value;
    if (!root) return;
    if (group.value) {
        labelable.value = false;
        return;
    }
    const target = root.ownerDocument.getElementById(ids.control);
    if (!target || !root.contains(target)) return;
    const next = isLabelableElement(target);
    if (labelable.value !== next) labelable.value = next;
}

const controlProps = computed<FormFieldControlProps>(() => {
    const snapshot = state.value;
    return {
        id: ids.control,
        name: props.name,
        'aria-invalid': snapshot.invalid ? 'true' : undefined,
        'aria-describedby': describedBy(),
        'aria-errormessage': snapshot.invalid && layout.hasMessage && relation.value !== 'describedby' ? ids.message : undefined,
        'aria-required': snapshot.required ? 'true' : undefined,
        'aria-labelledby': layout.hasLabel && !labelable.value ? ids.label : undefined
    };
});

const slotProps = computed<FormFieldSlotProps>(() => {
    const snapshot = state.value;
    return {
        value: snapshot.value,
        setValue,
        onUpdate: onControlUpdate,
        onBlur: blur,
        invalid: snapshot.invalid,
        error: snapshot.invalid ? snapshot.error : undefined,
        errors: snapshot.invalid ? snapshot.errors : [],
        touched: snapshot.touched,
        dirty: snapshot.dirty,
        validating: snapshot.validating,
        required: snapshot.required,
        ids: { control: ids.control, label: ids.label, description: ids.description, message: ids.message },
        controlProps: controlProps.value
    };
});

// The field's content renders on its own, so a keystroke re-renders the control and not the frame.
const Content = () => {
    const nodes = normalize(slots.default?.(slotProps.value) as VNodeArrayChildren);
    const placedLabel = containsComponent(nodes, FormLabel) || parts.label > 0;
    const placedDescription = containsComponent(nodes, FormDescription) || parts.description > 0;
    const placedMessage = containsComponent(nodes, FormMessage) || parts.message > 0;
    const autoLabel = !!props.label && !placedLabel;
    const autoDescription = !!props.description && !placedDescription;
    const autoMessage = props.message && !placedMessage;
    const next = { hasLabel: autoLabel || placedLabel, hasDescription: autoDescription || placedDescription, hasMessage: autoMessage || placedMessage };
    if (next.hasLabel !== layout.hasLabel) layout.hasLabel = next.hasLabel;
    if (next.hasDescription !== layout.hasDescription) layout.hasDescription = next.hasDescription;
    if (next.hasMessage !== layout.hasMessage) layout.hasMessage = next.hasMessage;

    let body = nodes;
    if (props.autoBind) {
        const controls = findControls(nodes);
        body = controls.length ? wire(nodes, controls) : mapControls(nodes, () => null, wireLater);
    }
    void nextTick(checkLabelable);
    return [
        autoLabel ? h(FormLabel, { key: AUTO_PARTS.label }) : null,
        autoDescription ? h(FormDescription, { key: AUTO_PARTS.description }) : null,
        ...body,
        autoMessage ? h(FormMessage, { key: AUTO_PARTS.message }) : null
    ];
};

const groupAttrs = computed(() => {
    if (!group.value) return {};
    const snapshot = state.value;
    const radio = groupKind.value === 'radio';
    return {
        id: ids.control,
        role: radio ? 'radiogroup' : 'group',
        'aria-labelledby': layout.hasLabel ? ids.label : undefined,
        'aria-describedby': describedBy(),
        'aria-invalid': snapshot.invalid ? 'true' : undefined,
        'aria-errormessage': snapshot.invalid && layout.hasMessage && relation.value !== 'describedby' ? ids.message : undefined,
        'aria-required': radio && snapshot.required ? 'true' : undefined
    };
});

const rootState = computed(() => ({ invalid: state.value.invalid, group: group.value, disabled: form.disabled.value }));

const context: FieldContext = {
    name: computed(() => props.name),
    state,
    ids,
    labelText,
    labelProp: () => props.label,
    descriptionProp: () => props.description,
    labelable,
    group,
    parts,
    registerPart(kind, element) {
        parts[kind]++;
        if (kind === 'label' && element) labelElements.add(element);
        return () => {
            parts[kind]--;
            if (element) labelElements.delete(element);
        };
    },
    quiet,
    focus,
    setValue,
    blur,
    unstyled: () => styled.unstyled,
    pt: () => styled.pt
};
provide(FieldKey, context);

onMounted(checkLabelable);
onBeforeUnmount(() => {
    stopWatching();
    registration.unregister();
    unregisterEntry();
});

defineExpose({ focus, validate: () => form.form.validateField(props.name, 'submit') });
</script>

<template>
    <component :is="as ?? 'div'" ref="rootRef" v-bind="mergeProps(part('field', rootState), groupAttrs)" :data-field="name" @focusout="onFocusout" @change="onNativeChange">
        <Content />
    </component>
</template>
