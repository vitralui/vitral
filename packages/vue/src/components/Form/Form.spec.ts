import { createForm, functionResolver, rules } from '@vitral/forms';
import { ptBR } from '@vitral/core';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref, type Component } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import { useForm } from '../../composables/useForm';
import { useFormField } from '../../composables/useFormField';
import Checkbox from '../Checkbox/Checkbox.vue';
import DatePicker from '../DatePicker/DatePicker.vue';
import Editor from '../Editor/Editor.vue';
import IconField from '../IconField/IconField.vue';
import InputNumber from '../InputNumber/InputNumber.vue';
import InputText from '../InputText/InputText.vue';
import MultiSelect from '../MultiSelect/MultiSelect.vue';
import Password from '../Password/Password.vue';
import RadioButton from '../RadioButton/RadioButton.vue';
import RadioGroup from '../RadioGroup/RadioGroup.vue';
import Rating from '../Rating/Rating.vue';
import Select from '../Select/Select.vue';
import SelectButton from '../SelectButton/SelectButton.vue';
import Slider from '../Slider/Slider.vue';
import Textarea from '../Textarea/Textarea.vue';
import ToggleButton from '../ToggleButton/ToggleButton.vue';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch.vue';
import {
    Form,
    FormDescription,
    FormErrors,
    FormField,
    FormFieldArray,
    FormLabel,
    FormMessage,
    FormReset,
    FormRoot,
    FormSubmit,
    FormSummary
} from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const settle = async () => {
    await flushPromises();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushPromises();
};

/** Mounts a render function inside the plugin. */
function mountForm(render: () => unknown, vitral?: Record<string, unknown>) {
    return mountVt(defineComponent({ setup: () => render as () => Any }), {}, vitral ? { theme: 'none', ...vitral } : undefined);
}

function field(name: string, props: Record<string, unknown>, control: () => unknown) {
    return h(FormField, { name, ...props }, { default: control });
}

async function submit(wrapper: { find: (s: string) => Any }) {
    await wrapper.find('form').trigger('submit');
    await settle();
}

describe('Form namespace', () => {
    it('is a plain object of parts, never a component itself', () => {
        expect(Object.isFrozen(Form)).toBe(true);
        expect(Form).not.toHaveProperty('setup');
        expect(Form).not.toHaveProperty('render');
        expect(Form).not.toHaveProperty('name');
        expect(Form.Root).toBe(FormRoot);
        expect(Form.Field).toBe(FormField);
        expect(Form.Label).toBe(FormLabel);
        expect(Form.Description).toBe(FormDescription);
        expect(Form.Message).toBe(FormMessage);
        expect(Form.Summary).toBe(FormSummary);
        expect(Form.Errors).toBe(FormSummary);
        expect(FormErrors).toBe(FormSummary);
        expect(Form.Submit).toBe(FormSubmit);
        expect(Form.Reset).toBe(FormReset);
        expect(Form.FieldArray).toBe(FormFieldArray);
        const names = Object.values(Form).map((part) => (part as { name?: string }).name);
        for (const name of names) expect(name).toMatch(/^VtForm[A-Z]/);
    });

    it('can be registered part by part without a warning about reserved names', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const wrapper = mountVt(
            defineComponent({
                components: { FormRoot, FormField },
                template: '<FormRoot><FormField name="a" label="A"><input /></FormField></FormRoot>'
            }),
            { global: { config: { compilerOptions: {} } } }
        );
        expect(wrapper.find('form').exists()).toBe(true);
        expect(warn.mock.calls.filter((call) => String(call[0]).includes('reserved'))).toEqual([]);
        warn.mockRestore();
    });
});

describe('Form.Root', () => {
    it('renders a native form that does not validate by itself', () => {
        const wrapper = mountVt(FormRoot, { attrs: { 'aria-label': 'Sign up', class: 'wide' } });
        const form = wrapper.find('form');
        expect(form.attributes()).toMatchObject({ novalidate: '', 'aria-label': 'Sign up' });
        expect(form.classes()).toEqual(expect.arrayContaining(['vt-form', 'wide']));
    });

    it('emits submit with the values and their validity, and invalid-submit when they fail', async () => {
        const onSubmit = vi.fn();
        const onInvalid = vi.fn();
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { email: '' }, onSubmit, 'onInvalid-submit': onInvalid }, () => field('email', { label: 'Email', rules: [rules.required(), rules.email()] }, () => h(InputText)))
        );
        await submit(wrapper);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0]![0]).toMatchObject({ valid: false, values: { email: '' }, errors: { email: ['This field is required.'] } });
        expect(onInvalid).toHaveBeenCalledWith(expect.objectContaining({ errors: { email: ['This field is required.'] } }));

        await wrapper.find('input').setValue('ada@example.com');
        await submit(wrapper);
        expect(onSubmit).toHaveBeenCalledTimes(2);
        expect(onSubmit.mock.calls[1]![0]).toMatchObject({ valid: true, values: { email: 'ada@example.com' }, errors: {} });
        expect(onInvalid).toHaveBeenCalledTimes(1);
    });

    it('keeps the form submitting while an async handler runs, with the submit button busy', async () => {
        let release!: () => void;
        const onSubmit = vi.fn((event: { valid: boolean }) => (event.valid ? new Promise<void>((resolve) => (release = resolve)) : undefined));
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { name: 'Ada' }, onSubmit }, () => [field('name', { label: 'Name' }, () => h(InputText)), h(FormSubmit, { label: 'Save' })]));
        const button = wrapper.find('button[type="submit"]');
        expect(button.text()).toBe('Save');
        await button.trigger('click');
        await wrapper.find('form').trigger('submit');
        await settle();
        expect(button.attributes('aria-busy')).toBe('true');
        expect(button.attributes('disabled')).toBeDefined();
        release();
        await settle();
        expect(button.attributes('aria-busy')).toBeUndefined();
        expect(button.attributes('disabled')).toBeUndefined();
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('lets the handler report server errors, which the field and the summary then show', async () => {
        const wrapper = mountForm(() =>
            h(
                FormRoot,
                {
                    initialValues: { email: 'taken@example.com' },
                    onSubmit: (event: { valid: boolean; setErrors: (e: Record<string, string>) => void }) => event.valid && event.setErrors({ email: 'That address is already registered.' })
                },
                () => [h(FormSummary), field('email', { label: 'Email' }, () => h(InputText))]
            )
        );
        await submit(wrapper);
        expect(wrapper.find('.vt-form-message').text()).toBe('That address is already registered.');
        expect(wrapper.find('.vt-form-summary').exists()).toBe(true);
        expect(document.activeElement).toBe(wrapper.find('.vt-form-summary').element);
    });

    it('binds v-model both ways', async () => {
        const values = ref<Record<string, unknown>>({ name: 'Ada', address: { city: 'Recife' } });
        const wrapper = mountForm(() =>
            h(FormRoot, { modelValue: values.value, 'onUpdate:modelValue': (v: Any) => (values.value = v) }, () => [
                field('name', { label: 'Name' }, () => h(InputText)),
                field('address.city', { label: 'City' }, () => h(InputText))
            ])
        );
        const [name, city] = wrapper.findAll('input');
        expect(name!.element.value).toBe('Ada');
        expect(city!.element.value).toBe('Recife');
        await city!.setValue('Olinda');
        expect(values.value).toEqual({ name: 'Ada', address: { city: 'Olinda' } });
        values.value = { name: 'Grace', address: { city: 'Natal' } };
        await settle();
        expect(name!.element.value).toBe('Grace');
        expect(city!.element.value).toBe('Natal');
        // A change made deep inside a reactive model reaches the form too.
        const deep = reactive({ name: 'x' });
        const other = mountForm(() => h(FormRoot, { modelValue: deep }, () => field('name', { label: 'Name' }, () => h(InputText))));
        deep.name = 'y';
        await settle();
        expect(other.find('input').element.value).toBe('y');
    });

    it('starts from the initial values and follows a new set', async () => {
        const initial = ref({ name: 'Ada' });
        const wrapper = mountForm(() => h(FormRoot, { initialValues: initial.value }, () => field('name', { label: 'Name' }, () => h(InputText))));
        expect(wrapper.find('input').element.value).toBe('Ada');
        initial.value = { name: 'Grace' };
        await settle();
        expect(wrapper.find('input').element.value).toBe('Grace');
    });

    it('resets through a reset button, clearing values, errors and the summary', async () => {
        const onReset = vi.fn();
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { name: '' }, onReset }, () => [h(FormSummary), field('name', { label: 'Name', required: true }, () => h(InputText)), h(FormReset, { label: 'Clear' })])
        );
        await wrapper.find('input').setValue('x');
        await wrapper.find('input').setValue('');
        await submit(wrapper);
        expect(wrapper.find('.vt-form-summary').exists()).toBe(true);
        expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
        await wrapper.find('input').setValue('typed');
        await wrapper.find('form').trigger('reset');
        await settle();
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(wrapper.find('input').element.value).toBe('');
        expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined();
        expect(wrapper.find('.vt-form-summary').exists()).toBe(false);
        expect(wrapper.find('.vt-form-message').text()).toBe('');
        const reset = wrapper.find('button[type="reset"]');
        expect(reset.text()).toBe('Clear');
    });

    it('takes a resolver and checks across fields', async () => {
        const resolver = functionResolver<{ password: string; confirm: string }>((v) => ({
            password: v.password.length < 4 ? 'Use at least 4 characters.' : undefined,
            confirm: v.confirm !== v.password ? 'The passwords differ.' : undefined
        }));
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { password: '', confirm: '' }, resolver }, () => [
                field('password', { label: 'Password' }, () => h(InputText, { type: 'password' })),
                field('confirm', { label: 'Confirm' }, () => h(InputText, { type: 'password' }))
            ])
        );
        await submit(wrapper);
        const messages = wrapper.findAll('.vt-form-message').map((m) => m.text());
        expect(messages).toEqual(['Use at least 4 characters.', '']);
        await wrapper.findAll('input')[1]!.setValue('abcd');
        await settle();
        expect(wrapper.findAll('.vt-form-message').map((m) => m.text())).toEqual(['Use at least 4 characters.', 'The passwords differ.']);
        await wrapper.findAll('input')[0]!.setValue('abcd');
        await settle();
        expect(wrapper.findAll('.vt-form-message').map((m) => m.text())).toEqual(['', '']);
    });

    it('drives a form made by useForm()', async () => {
        let handle!: ReturnType<typeof useForm>;
        const wrapper = mountVt(
            defineComponent({
                setup() {
                    handle = useForm<Record<string, Any>>({ initialValues: { name: '' }, rules: { name: rules.required() } });
                    return () => h(FormRoot, { form: handle }, () => field('name', { label: 'Name' }, () => h(InputText)));
                }
            })
        );
        handle.setValue('name', 'Ada');
        await settle();
        expect(wrapper.find('input').element.value).toBe('Ada');
        handle.setValue('name', '');
        const result = await handle.validate();
        await settle();
        expect(result.valid).toBe(false);
        expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
        expect(handle.valid.value).toBe(false);
    });

    it('disables the wired controls and the submit button', () => {
        const wrapper = mountForm(() => h(FormRoot, { disabled: true }, () => [field('name', { label: 'Name' }, () => h(InputText)), h(FormSubmit, { label: 'Go' })]));
        expect(wrapper.find('input').attributes('disabled')).toBeDefined();
        expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    });

    it('offers its state to the default slot', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: 'x' } }, { default: (s: Any) => [field('a', { label: 'A' }, () => h(InputText)), h('output', `${s.dirty}:${s.values.a}:${s.submitCount}`)] })
        );
        expect(wrapper.find('output').text()).toBe('false:x:0');
        await wrapper.find('input').setValue('y');
        expect(wrapper.find('output').text()).toBe('true:y:0');
        await submit(wrapper);
        expect(wrapper.find('output').text()).toBe('true:y:1');
    });

    it('drops its classes when unstyled, and passes pt to the parts', () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { unstyled: true, pt: { field: { 'data-part': 'field' }, root: 'custom' } }, () => field('a', { label: 'A', description: 'Hint' }, () => h(InputText)))
        );
        expect(wrapper.find('form').classes()).toEqual(['custom']);
        expect(wrapper.find('[data-part="field"]').exists()).toBe(true);
        expect(wrapper.find('[data-part="field"]').classes()).not.toContain('vt-form-field');
        expect(wrapper.find('p').classes()).not.toContain('vt-form-description');
    });
});

describe('Form.Field', () => {
    it('wires an InputText: value, name, id, label and hint, with no invalid state before validation', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { email: 'a' } }, () => field('email', { label: 'Email', description: 'We never share it.', required: true, rules: rules.email() }, () => h(InputText)))
        );
        await settle();
        const input = wrapper.find('input');
        const label = wrapper.find('label');
        const hint = wrapper.find('.vt-form-description');
        const message = wrapper.find('.vt-form-message');
        expect(input.element.value).toBe('a');
        expect(input.attributes('name')).toBe('email');
        expect(label.attributes('for')).toBe(input.attributes('id'));
        expect(label.text()).toContain('Email');
        expect(label.find('.vt-label-required').exists()).toBe(true);
        expect(input.attributes('aria-required')).toBe('true');
        expect(input.attributes('aria-describedby')).toBe(hint.attributes('id'));
        expect(input.attributes('aria-invalid')).toBeUndefined();
        expect(input.attributes('aria-errormessage')).toBeUndefined();
        expect(message.text()).toBe('');
        expect(message.attributes('aria-live')).toBe('polite');
        await expectNoA11yViolations();
    });

    it('shows the error after a submit, silently, and ties it to the control', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { email: 'a' } }, () => field('email', { label: 'Email', description: 'Work address', rules: rules.email() }, () => h(InputText))));
        await submit(wrapper);
        const input = wrapper.find('input');
        const message = wrapper.find('.vt-form-message');
        expect(input.attributes('aria-invalid')).toBe('true');
        expect(input.attributes('aria-describedby')!.split(' ')).toEqual([wrapper.find('.vt-form-description').attributes('id'), message.attributes('id')]);
        expect(input.attributes('aria-errormessage')).toBe(message.attributes('id'));
        expect(message.text()).toBe('Enter an email address like name@example.com.');
        expect(message.find('svg').attributes('aria-hidden')).toBe('true');
        // Focus carried the message; the live region stays quiet until the user acts.
        expect(message.attributes('aria-live')).toBe('off');
        expect(wrapper.find('.vt-form-field').classes()).toContain('vt-form-field-invalid');
        expect(document.activeElement).toBe(input.element);
        await expectNoA11yViolations();

        await input.setValue('ab');
        await settle();
        expect(message.attributes('aria-live')).toBe('polite');
        await input.setValue('ab@example.com');
        await settle();
        expect(input.attributes('aria-invalid')).toBeUndefined();
        expect(message.text()).toBe('');
        expect(input.attributes('aria-describedby')).toBe(wrapper.find('.vt-form-description').attributes('id'));
    });

    it('points at the error through one attribute when asked', async () => {
        const make = (errorRelation: 'describedby' | 'errormessage') =>
            mountForm(() => h(FormRoot, { initialValues: { a: '' }, errorRelation }, () => field('a', { label: 'A', required: true }, () => h(InputText))));
        const describedOnly = make('describedby');
        await submit(describedOnly);
        expect(describedOnly.find('input').attributes('aria-errormessage')).toBeUndefined();
        expect(describedOnly.find('input').attributes('aria-describedby')).toBe(describedOnly.find('.vt-form-message').attributes('id'));
        const errorOnly = make('errormessage');
        await submit(errorOnly);
        expect(errorOnly.find('input').attributes('aria-errormessage')).toBe(errorOnly.find('.vt-form-message').attributes('id'));
        expect(errorOnly.find('input').attributes('aria-describedby')).toBeUndefined();
    });

    it('validates on blur when told to, and announces that error', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { name: '' }, validateOn: 'blur' }, () => [field('name', { label: 'Name', rules: rules.minLength(3) }, () => h(InputText)), h('button', { type: 'button' }, 'Next')])
        );
        const input = wrapper.find('input');
        input.element.focus();
        await input.setValue('ab');
        await settle();
        expect(input.attributes('aria-invalid')).toBeUndefined();
        const next = wrapper.find('button').element as HTMLButtonElement;
        next.focus();
        input.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: next }));
        await settle();
        expect(input.attributes('aria-invalid')).toBe('true');
        const message = wrapper.find('.vt-form-message');
        expect(message.text()).toBe('Enter at least 3 characters.');
        expect(message.attributes('aria-live')).toBe('polite');
    });

    it('treats focus moving into a popup of the control as still inside', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { name: '' }, validateOn: 'blur' }, () => [
                field('name', { label: 'Name', required: true }, () => h(InputText, { 'aria-controls': 'popup' })),
                h('button', { type: 'button', id: 'after' }, 'After')
            ])
        );
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.innerHTML = '<button type="button">Pick</button>';
        document.body.appendChild(popup);
        const input = wrapper.find('input').element;
        const pick = popup.querySelector('button')!;
        input.focus();
        pick.focus();
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: pick }));
        await settle();
        expect(input.getAttribute('aria-invalid')).toBeNull();
        (document.getElementById('after') as HTMLButtonElement).focus();
        await settle();
        expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('validates a text box on its native change in change mode', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { name: '' }, validateOn: 'change' }, () => field('name', { label: 'Name', rules: rules.minLength(3) }, () => h(InputText))));
        const input = wrapper.find('input');
        input.element.focus();
        input.element.value = 'ab';
        await input.trigger('input');
        await settle();
        expect(input.attributes('aria-invalid')).toBeUndefined();
        await input.trigger('change');
        await settle();
        expect(input.attributes('aria-invalid')).toBe('true');
    });

    it('keeps the id and the listeners the control was given', async () => {
        const own = vi.fn();
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { a: '' } }, () => field('a', { label: 'A' }, () => h(InputText, { id: 'mine', 'aria-describedby': 'extra', 'onUpdate:modelValue': own }))));
        await settle();
        const input = wrapper.find('input');
        expect(input.attributes('id')).toBe('mine');
        expect(wrapper.find('label').attributes('for')).toBe('mine');
        await input.setValue('x');
        expect(own).toHaveBeenCalledWith('x');
        expect(input.attributes('aria-describedby')).toBe('extra');
    });

    it('lets Form.Label, Form.Description and Form.Message be placed and styled by hand', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: '' } }, () =>
                h(
                    FormField,
                    { name: 'a', required: true },
                    {
                        default: () => [
                            h(FormLabel, null, () => 'Your name'),
                            h(InputText),
                            h(FormDescription, { as: 'div' }, () => 'As on your passport.'),
                            h(FormMessage, { hideIcon: true }, { default: ({ error }: { error: string }) => h('strong', error) })
                        ]
                    }
                )
            )
        );
        await submit(wrapper);
        expect(wrapper.findAll('label')).toHaveLength(1);
        expect(wrapper.findAll('.vt-form-message')).toHaveLength(1);
        expect(wrapper.find('div.vt-form-description').text()).toBe('As on your passport.');
        expect(wrapper.find('.vt-form-message strong').text()).toBe('This field is required.');
        expect(wrapper.find('.vt-form-message svg').exists()).toBe(false);
        expect(wrapper.find('input').attributes('aria-describedby')).toContain(wrapper.find('.vt-form-description').attributes('id'));
        await expectNoA11yViolations();
    });

    it('shows every message with `all`, and none with message off', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: '' }, resolver: () => ({ errors: { a: ['One.', 'Two.'] } }) }, () => [
                h(FormField, { name: 'a', label: 'A' }, () => [h(InputText), h(FormMessage, { all: true })]),
                field('b', { label: 'B', message: false }, () => h(InputText))
            ])
        );
        await submit(wrapper);
        expect(wrapper.findAll('.vt-form-message').map((m) => m.text())).toEqual(['One. Two.']);
        expect(wrapper.findAll('input')[1]!.attributes('aria-errormessage')).toBeUndefined();
    });

    it('offers value, state, ids and control attributes to a native control through its slot', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { code: '' } }, () =>
                h(
                    FormField,
                    { name: 'code', label: 'Code', required: true, autoBind: false },
                    {
                        default: (s: Any) =>
                            h('input', {
                                ...s.controlProps,
                                value: s.value,
                                onInput: (e: Event) => s.setValue((e.target as HTMLInputElement).value, 'input'),
                                onBlur: s.onBlur
                            })
                    }
                )
            )
        );
        const input = wrapper.find('input');
        expect(input.attributes()).toMatchObject({ name: 'code', 'aria-required': 'true' });
        expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'));
        await submit(wrapper);
        expect(input.attributes('aria-invalid')).toBe('true');
        expect(input.attributes('aria-errormessage')).toBe(wrapper.find('.vt-form-message').attributes('id'));
        await input.setValue('42');
        await settle();
        expect(input.attributes('aria-invalid')).toBeUndefined();
    });

    it('wires a control of your own that has a modelValue prop, and one using useFormField()', async () => {
        const Custom = defineComponent({
            props: { modelValue: String, invalid: Boolean },
            emits: ['update:modelValue'],
            setup: (props, { emit, attrs }) => () => h('input', { ...attrs, value: props.modelValue, 'data-invalid': String(props.invalid), onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value) })
        });
        const Composed = defineComponent({
            setup() {
                const f = useFormField();
                return () => h('input', { ...f.controlProps.value, class: 'composed', value: f.value.value, onInput: (e: Event) => f.setValue((e.target as HTMLInputElement).value, 'input'), onBlur: f.onBlur });
            }
        });
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: '', b: '' } }, () => [
                field('a', { label: 'A', required: true }, () => h(Custom)),
                field('b', { label: 'B', required: true, autoBind: false }, () => h(Composed))
            ])
        );
        const [a, b] = wrapper.findAll('input');
        expect(a!.attributes('name')).toBe('a');
        await submit(wrapper);
        expect(a!.attributes('data-invalid')).toBe('true');
        expect(b!.attributes('aria-invalid')).toBe('true');
        await b!.setValue('x');
        await settle();
        expect(b!.attributes('aria-invalid')).toBeUndefined();
        expect(b!.attributes('name')).toBe('b');
    });

    it('finds a control inside another component', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { q: 'hi' } }, () =>
                field('q', { label: 'Search', required: true }, () => h(IconField, null, () => [h('span', { class: 'icon' }), h(InputText, { placeholder: 'Search' })]))
            )
        );
        await settle();
        const input = wrapper.find('input');
        expect(input.element.value).toBe('hi');
        expect(input.attributes('name')).toBe('q');
        expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'));
        await input.setValue('');
        await submit(wrapper);
        expect(input.attributes('aria-invalid')).toBe('true');
    });

    it('binds only the first control, leaving others alone', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { a: 'one' } }, () => field('a', { label: 'A' }, () => h('div', [h(InputText), h(InputText, { modelValue: 'other' })]))));
        const [first, second] = wrapper.findAll('input');
        expect(first!.element.value).toBe('one');
        expect(second!.element.value).toBe('other');
        expect(second!.attributes('name')).toBeUndefined();
    });

    it('follows a renamed path', async () => {
        const name = ref('a');
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { a: 'A', b: 'B' } }, () => field(name.value, { label: 'Field' }, () => h(InputText))));
        expect(wrapper.find('input').element.value).toBe('A');
        name.value = 'b';
        await settle();
        expect(wrapper.find('input').element.value).toBe('B');
        expect(wrapper.find('input').attributes('name')).toBe('b');
    });

    it('throws a helpful error outside a Form.Root', () => {
        const error = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(() => mountVt(FormField, { props: { name: 'a' } })).toThrow(/Form\.Root/);
        expect(() => mountVt(FormMessage)).toThrow(/Form\.Field/);
        error.mockRestore();
    });

    it('marks the field busy while an async check runs', async () => {
        vi.useFakeTimers();
        try {
            const check = rules.custom(async (v: unknown) => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return v !== 'taken' || 'That name is taken.';
            });
            const wrapper = mountForm(() =>
                h(FormRoot, { initialValues: { user: '' }, validateOn: 'input' }, () =>
                    h(FormField, { name: 'user', label: 'User', rules: check, debounce: 50 }, { default: (s: Any) => [h(InputText), h('output', s.validating ? 'busy' : 'idle')] })
                )
            );
            const input = wrapper.find('input');
            input.element.focus();
            await input.setValue('taken');
            expect(wrapper.find('output').text()).toBe('busy');
            await vi.advanceTimersByTimeAsync(200);
            await nextTick();
            expect(wrapper.find('output').text()).toBe('idle');
            expect(wrapper.find('.vt-form-message').text()).toBe('That name is taken.');
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('Form.Field with every kind of control', () => {
    const options = [
        { name: 'Recife', code: 'REC' },
        { name: 'Natal', code: 'NAT' }
    ];

    it('wires a Select: value, label, invalid combobox', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { city: null } }, () => field('city', { label: 'City', required: true }, () => h(Select, { options, optionLabel: 'name', optionValue: 'code' })))
        );
        await settle();
        const combobox = wrapper.find('[role="combobox"]');
        expect(wrapper.find('label').attributes('for')).toBe(combobox.attributes('id'));
        expect(combobox.attributes('aria-required')).toBe('true');
        await submit(wrapper);
        expect(combobox.attributes('aria-invalid')).toBe('true');
        expect(document.activeElement).toBe(combobox.element);
        await expectNoA11yViolations();
        await combobox.trigger('click');
        await settle();
        const option = document.querySelectorAll('[role="option"]')[1] as HTMLElement;
        option.click();
        await settle();
        expect(combobox.text()).toBe('Natal');
        expect(combobox.attributes('aria-invalid')).toBeUndefined();
    });

    it('wires a binary Checkbox, refusing false when required', async () => {
        const values = ref<Record<string, unknown>>({ terms: false });
        const wrapper = mountForm(() =>
            h(FormRoot, { modelValue: values.value, 'onUpdate:modelValue': (v: Any) => (values.value = v) }, () => field('terms', { required: true }, () => h(Checkbox, { label: 'I accept the terms' })))
        );
        const box = wrapper.find('input[type="checkbox"]');
        expect(box.attributes('name')).toBe('terms');
        await submit(wrapper);
        expect(box.attributes('aria-invalid')).toBe('true');
        expect(wrapper.find('.vt-form-summary').exists()).toBe(false);
        await box.trigger('click');
        await settle();
        expect(values.value.terms).toBe(true);
        expect(box.attributes('aria-invalid')).toBeUndefined();
        await expectNoA11yViolations();
    });

    it('makes the field a group for several checkboxes sharing an array', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { tags: [] } }, () =>
                field('tags', { label: 'Topics', rules: rules.minLength(1, 'Pick at least one topic.'), required: true }, () => [
                    h(Checkbox, { value: 'vue', label: 'Vue' }),
                    h(Checkbox, { value: 'css', label: 'CSS' })
                ])
            )
        );
        await settle();
        const group = wrapper.find('.vt-form-field');
        expect(group.attributes('role')).toBe('group');
        expect(group.attributes('aria-labelledby')).toBe(wrapper.find('label.vt-form-label').attributes('id'));
        expect(wrapper.find('label.vt-form-label').attributes('for')).toBeUndefined();
        const boxes = wrapper.findAll('input[type="checkbox"]');
        expect(boxes.map((b) => b.attributes('name'))).toEqual(['tags', 'tags']);
        await submit(wrapper);
        expect(group.attributes('aria-invalid')).toBe('true');
        expect(group.attributes('aria-describedby')).toBe(wrapper.find('.vt-form-message').attributes('id'));
        expect(document.activeElement).toBe(boxes[0]!.element);
        await expectNoA11yViolations();
        await boxes[1]!.trigger('click');
        await settle();
        expect((boxes[1]!.element as HTMLInputElement).checked).toBe(true);
        expect(group.attributes('aria-invalid')).toBeUndefined();
    });

    it('makes the field a radio group for loose radio buttons', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { plan: null } }, () =>
                field('plan', { label: 'Plan', required: true }, () => [h(RadioButton, { value: 'free', label: 'Free' }), h(RadioButton, { value: 'pro', label: 'Pro' })])
            )
        );
        await settle();
        const group = wrapper.find('.vt-form-field');
        expect(group.attributes('role')).toBe('radiogroup');
        expect(group.attributes('aria-required')).toBe('true');
        const radios = wrapper.findAll('input[type="radio"]');
        expect(radios.map((r) => r.attributes('name'))).toEqual(['plan', 'plan']);
        await submit(wrapper);
        expect(group.attributes('aria-invalid')).toBe('true');
        await expectNoA11yViolations();
        await radios[1]!.trigger('change');
        await settle();
        expect((radios[1]!.element as HTMLInputElement).checked).toBe(true);
        expect(group.attributes('aria-invalid')).toBeUndefined();
        // The summary link goes to the group, and focus lands on the chosen radio.
        const ctx = wrapper.findComponent(FormField);
        (ctx.vm as Any).focus();
        expect(document.activeElement).toBe(radios[1]!.element);
    });

    it('wires a RadioGroup, labelled by the field label', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { size: null } }, () =>
                field('size', { label: 'Size', required: true }, () => h(RadioGroup, null, () => [h(RadioButton, { value: 's', label: 'Small' }), h(RadioButton, { value: 'l', label: 'Large' })]))
            )
        );
        await settle();
        const group = wrapper.find('[role="radiogroup"]');
        const label = wrapper.find('label.vt-form-label');
        expect(group.attributes('aria-labelledby')).toBe(label.attributes('id'));
        expect(label.attributes('for')).toBeUndefined();
        expect(wrapper.findAll('input[type="radio"]').map((r) => r.attributes('name'))).toEqual(['size', 'size']);
        await submit(wrapper);
        expect(group.attributes('aria-invalid')).toBe('true');
        expect(group.attributes('aria-describedby')).toBe(wrapper.find('.vt-form-message').attributes('id'));
        expect(document.activeElement).toBe(wrapper.find('input[type="radio"]').element);
        await expectNoA11yViolations();
        // Pressing the label moves focus to the group.
        (document.body as HTMLElement).focus();
        await label.trigger('click');
        expect(document.activeElement).toBe(wrapper.find('input[type="radio"]').element);
    });

    it('wires a ToggleSwitch', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { news: false } }, () => field('news', { label: 'Newsletter', rules: rules.custom((v) => v === true, 'Turn it on.') }, () => h(ToggleSwitch))));
        await settle();
        const input = wrapper.find('input[role="switch"]');
        expect(wrapper.find('label.vt-form-label').attributes('for')).toBe(input.attributes('id'));
        await submit(wrapper);
        expect(input.attributes('aria-invalid')).toBe('true');
        await input.trigger('change');
        await settle();
        expect((input.element as HTMLInputElement).checked).toBe(true);
        expect(input.attributes('aria-invalid')).toBeUndefined();
        await expectNoA11yViolations();
    });

    it('wires a DatePicker with a date value and a min rule', async () => {
        const min = new Date(2026, 0, 10);
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { start: new Date(2026, 0, 5) } }, () => field('start', { label: 'Start', rules: rules.min(min) }, () => h(DatePicker))));
        await settle();
        const input = wrapper.find('input');
        expect(wrapper.find('label.vt-form-label').attributes('for')).toBe(input.attributes('id'));
        expect(input.element.value).not.toBe('');
        await submit(wrapper);
        expect(input.attributes('aria-invalid')).toBe('true');
        expect(wrapper.find('.vt-form-message').text()).toContain(min.toLocaleDateString());
        await expectNoA11yViolations();
    });

    it('wires the Editor, labelled through aria-labelledby', async () => {
        const values = ref<Record<string, unknown>>({ bio: '' });
        const wrapper = mountForm(() =>
            h(FormRoot, { modelValue: values.value, 'onUpdate:modelValue': (v: Any) => (values.value = v) }, () =>
                field('bio', { label: 'Bio', required: true, rules: rules.custom((v: unknown) => !!String(v ?? '').replace(/<[^>]+>/g, '').trim(), 'Write something.') }, () => h(Editor, { toolbar: false }))
            )
        );
        await settle();
        const text = wrapper.find('[role="textbox"]');
        expect(text.attributes('aria-labelledby')).toBe(wrapper.find('label.vt-form-label').attributes('id'));
        expect(wrapper.find('label.vt-form-label').attributes('for')).toBeUndefined();
        await submit(wrapper);
        expect(wrapper.find('.vt-form-message').text()).toBe('This field is required.');
        expect(document.activeElement).toBe(text.element);
        expect(text.attributes('aria-describedby')).toContain(wrapper.find('.vt-form-message').attributes('id'));
        await expectNoA11yViolations();
    });

    it('marks invalid the controls that only style their invalid state', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { pinned: false, view: null } }, () => [
                field('pinned', { label: 'Pinned', required: true }, () => h(ToggleButton, { onLabel: 'On', offLabel: 'Off' })),
                field('view', { label: 'View', required: true }, () => h(SelectButton, { options: ['Day', 'Week'] }))
            ])
        );
        await submit(wrapper);
        expect(wrapper.find('button[aria-pressed]').attributes('aria-invalid')).toBe('true');
        expect(wrapper.find('.vt-selectbutton').attributes('aria-invalid')).toBe('true');
        expect(wrapper.find('.vt-selectbutton').attributes('aria-labelledby')).toBe(wrapper.findAll('label.vt-form-label')[1]!.attributes('id'));
        await expectNoA11yViolations();
    });

    it('binds the rest of the controls by value and name', async () => {
        const cases: [string, Component, Record<string, unknown>, unknown, string][] = [
            ['bio', Textarea, {}, 'Hello', 'textarea'],
            ['age', InputNumber, {}, 42, 'input'],
            ['secret', Password, { feedback: false }, 'pw', 'input'],
            ['langs', MultiSelect, { options: ['pt', 'en'] }, ['pt'], '[role="combobox"]'],
            ['volume', Slider, {}, 30, '[role="slider"]'],
            ['stars', Rating, {}, 3, '[role="radiogroup"]'],
            ['mode', SelectButton, { options: ['a', 'b'] }, 'a', '[role="group"]']
        ];
        for (const [name, component, props, value, selector] of cases) {
            const values = ref<Record<string, unknown>>({ [name]: value });
            const wrapper = mountForm(() =>
                h(FormRoot, { modelValue: values.value, 'onUpdate:modelValue': (v: Any) => (values.value = v) }, () => field(name, { label: name, required: true }, () => h(component, props)))
            );
            await settle();
            const control = wrapper.find(selector);
            expect(control.exists(), name).toBe(true);
            const label = wrapper.find('label.vt-form-label');
            const named = label.attributes('for') === control.attributes('id') || control.attributes('aria-labelledby')?.includes(label.attributes('id')!);
            expect(named, `${name} is named by its label`).toBe(true);
            await submit(wrapper);
            expect(wrapper.find('[aria-invalid="true"]').exists(), `${name} holds a valid value`).toBe(false);
            await expectNoA11yViolations();
            wrapper.unmount();
        }
    });
});

describe('Form.Summary', () => {
    it('lists the errors after a failed submit, in page order, and takes focus', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { name: '', email: 'x', extra: '' }, validate: () => ({ extra: 'Something else is wrong.' }) }, () => [
                h(FormSummary),
                field('name', { label: 'Name', required: true }, () => h(InputText)),
                field('email', { label: 'Email', rules: rules.email() }, () => h(InputText))
            ])
        );
        expect(wrapper.find('.vt-form-summary').exists()).toBe(false);
        await submit(wrapper);
        const summary = wrapper.find('.vt-form-summary');
        expect(summary.attributes('tabindex')).toBe('-1');
        expect(document.activeElement).toBe(summary.element);
        expect(summary.find('[role="alert"]').exists()).toBe(true);
        expect(summary.find('h2').text()).toBe('There is a problem');
        const items = summary.findAll('li');
        expect(items.map((li) => li.text())).toEqual(['Name: This field is required.', 'Email: Enter an email address like name@example.com.', 'Something else is wrong.']);
        const links = summary.findAll('a');
        expect(links).toHaveLength(2);
        expect(links[0]!.attributes('href')).toBe(`#${wrapper.findAll('input')[0]!.attributes('id')}`);
        // The inline messages stay silent: the summary speaks for them.
        for (const message of wrapper.findAll('.vt-form-message')) expect(message.attributes('aria-live')).toBe('off');
        await expectNoA11yViolations();

        await links[1]!.trigger('click');
        expect(document.activeElement).toBe(wrapper.findAll('input')[1]!.element);

        await wrapper.findAll('input')[0]!.setValue('Ada');
        await settle();
        expect(wrapper.findAll('.vt-form-summary li')).toHaveLength(2);
    });

    it('takes a title, a heading level and item content, and can stay out of focus', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: '' } }, () => [
                h(FormSummary, { title: 'Fix these', headingLevel: 3, autofocus: false }, { item: ({ item }: Any) => `→ ${item.message}` }),
                field('a', { label: 'A', required: true }, () => h(InputText))
            ])
        );
        await submit(wrapper);
        expect(wrapper.find('h3').text()).toBe('Fix these');
        expect(wrapper.find('.vt-form-summary a').text()).toBe('→ This field is required.');
        expect(document.activeElement).toBe(wrapper.find('input').element);
    });

    it('shows errors known before a submit only with `always`', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: '' }, validateOn: 'input' }, () => [h(FormSummary, { always: true }), field('a', { label: 'A', rules: rules.minLength(2) }, () => h(InputText))])
        );
        await wrapper.find('input').setValue('x');
        await settle();
        expect(wrapper.find('.vt-form-summary').exists()).toBe(true);
    });

    it('goes away after a successful submit', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { a: '' } }, () => [h(FormSummary), field('a', { label: 'A', required: true }, () => h(InputText))]));
        await submit(wrapper);
        expect(wrapper.find('.vt-form-summary').exists()).toBe(true);
        await wrapper.find('input').setValue('ok');
        await submit(wrapper);
        expect(wrapper.find('.vt-form-summary').exists()).toBe(false);
    });

    it('reads the locale', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { a: '' } }, () => [h(FormSummary), field('a', { label: 'Nome', required: true }, () => h(InputText))]), { locale: ptBR });
        await submit(wrapper);
        expect(wrapper.find('.vt-form-summary h2').text()).toBe('Há um problema');
        expect(wrapper.find('.vt-form-summary li').text()).toBe('Nome: Preencha este campo.');
    });
});

describe('Form.Submit and Form.Reset', () => {
    it('can wait for changes and for valid values', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: '' }, validateOn: 'input' }, () => [
                field('a', { label: 'A', rules: rules.minLength(2) }, () => h(InputText)),
                h(FormSubmit, { disableInvalid: true, disablePristine: true }, () => 'Send'),
                h(FormReset, { disablePristine: true }, () => 'Undo')
            ])
        );
        const [send, undo] = wrapper.findAll('button');
        expect(send!.text()).toBe('Send');
        expect(send!.attributes('disabled')).toBeDefined();
        expect(undo!.attributes('disabled')).toBeDefined();
        wrapper.find('input').element.focus();
        await wrapper.find('input').setValue('x');
        await settle();
        expect(send!.attributes('disabled')).toBeDefined();
        expect(undo!.attributes('disabled')).toBeUndefined();
        await wrapper.find('input').setValue('xy');
        await settle();
        expect(send!.attributes('disabled')).toBeUndefined();
        await undo!.trigger('click');
    });

    it('passes its other attributes to the button', () => {
        const wrapper = mountForm(() => h(FormRoot, null, () => [h(FormSubmit, { label: 'Go', severity: 'success', class: 'wide' }), h(FormReset, { label: 'Clear', variant: 'text' })]));
        const [go, clear] = wrapper.findAll('button');
        expect(go!.classes()).toEqual(expect.arrayContaining(['vt-button', 'wide', 'vt-form-submit']));
        expect(go!.classes().join(' ')).toContain('success');
        expect(clear!.classes().join(' ')).toContain('text');
        expect(clear!.attributes('type')).toBe('reset');
    });
});

describe('Form.FieldArray', () => {
    const Rows = () =>
        h(FormRoot, { initialValues: { guests: [{ name: 'Ada' }, { name: '' }] } }, () => [
            h(FormSummary),
            h(
                FormFieldArray,
                { name: 'guests', label: 'Guests', rules: rules.minLength(1, 'Add a guest.') },
                {
                    default: (s: Any) => [
                        ...s.fields.map((item: Any) =>
                            h('div', { key: item.key, class: 'row' }, [
                                field(`${item.name}.name`, { label: `Guest ${item.index + 1}`, required: true }, () => h(InputText)),
                                h('button', { type: 'button', class: 'up', disabled: item.first, onClick: () => s.move(item.index, item.index - 1) }, 'Up'),
                                h('button', { type: 'button', class: 'remove', onClick: () => s.remove(item.index) }, 'Remove')
                            ])
                        ),
                        h('button', { type: 'button', class: 'add', onClick: () => s.append({ name: '' }) }, 'Add'),
                        h(FormMessage)
                    ]
                }
            )
        ]);

    it('renders a row per item and adds, moves and removes them with their state', async () => {
        const wrapper = mountForm(Rows);
        const names = () => wrapper.findAll('.row input').map((i) => (i.element as HTMLInputElement).value);
        expect(names()).toEqual(['Ada', '']);
        const group = wrapper.find('[role="group"]');
        expect(group.attributes('aria-label')).toBe('Guests');
        await submit(wrapper);
        expect(wrapper.findAll('.row input').map((i) => i.attributes('aria-invalid'))).toEqual([undefined, 'true']);
        expect(wrapper.findAll('.vt-form-summary li').map((li) => li.text())).toEqual(['Guest 2: This field is required.']);

        await wrapper.findAll('.row .up')[1]!.trigger('click');
        await settle();
        expect(names()).toEqual(['', 'Ada']);
        expect(wrapper.findAll('.row input').map((i) => i.attributes('aria-invalid'))).toEqual(['true', undefined]);
        expect(wrapper.findAll('.row input').map((i) => i.attributes('name'))).toEqual(['guests.0.name', 'guests.1.name']);

        await wrapper.find('.add').trigger('click');
        await settle();
        expect(names()).toEqual(['', 'Ada', '']);
        expect(wrapper.findAll('.row input')[2]!.attributes('aria-invalid')).toBeUndefined();

        await wrapper.findAll('.row .remove')[0]!.trigger('click');
        await settle();
        expect(names()).toEqual(['Ada', '']);
        expect(wrapper.findAll('.row input').map((i) => i.attributes('aria-invalid'))).toEqual([undefined, undefined]);
        await expectNoA11yViolations();
    });

    it('shows an error for the list itself', async () => {
        const wrapper = mountForm(Rows);
        await wrapper.findAll('.row .remove')[1]!.trigger('click');
        await wrapper.findAll('.row .remove')[0]!.trigger('click');
        await settle();
        expect(wrapper.findAll('.row')).toHaveLength(0);
        await submit(wrapper);
        const group = wrapper.find('[role="group"]');
        expect(group.attributes('aria-invalid')).toBe('true');
        const message = wrapper.find('.vt-form-message');
        expect(message.text()).toBe('Add a guest.');
        expect(group.attributes('aria-describedby')).toBe(message.attributes('id'));
        expect(wrapper.find('.vt-form-summary a').attributes('href')).toBe(`#${group.attributes('id')}`);
        await expectNoA11yViolations();
        await wrapper.find('.add').trigger('click');
        await settle();
        expect(message.text()).toBe('');
    });
});

describe('useForm', () => {
    it('works on its own, with field() and handleSubmit()', async () => {
        const saved = vi.fn();
        const wrapper = mountVt(
            defineComponent({
                setup() {
                    const form = useForm({ initialValues: { email: '' } });
                    const email = form.field<string>('email', { rules: [rules.required(), rules.email()] });
                    const onSubmit = form.handleSubmit((values) => saved(values));
                    return () =>
                        h('form', { onSubmit, novalidate: true }, [
                            h('input', { value: email.value.value, ...email.attrs.value, onInput: (e: Event) => (email.value.value = (e.target as HTMLInputElement).value), onBlur: email.onBlur }),
                            h('p', { class: 'err' }, email.error.value ?? ''),
                            h('span', { class: 'state' }, `${form.valid.value}:${form.submitCount.value}:${form.dirty.value}`)
                        ]);
                }
            })
        );
        await wrapper.find('form').trigger('submit');
        await settle();
        expect(saved).not.toHaveBeenCalled();
        expect(wrapper.find('.err').text()).toBe('This field is required.');
        expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
        expect(wrapper.find('.state').text()).toBe('false:1:false');
        await wrapper.find('input').setValue('ada@example.com');
        await settle();
        expect(wrapper.find('.err').text()).toBe('');
        await wrapper.find('form').trigger('submit');
        await settle();
        expect(saved).toHaveBeenCalledWith({ email: 'ada@example.com' });
        expect(wrapper.find('.state').text()).toBe('true:2:true');
    });

    it('can be created outside a component, with English messages', async () => {
        const form = useForm({ initialValues: { a: '' }, rules: { a: rules.required() } });
        const result = await form.validate();
        expect(result.errors).toEqual({ a: ['This field is required.'] });
        expect(form.errors.value).toEqual({ a: ['This field is required.'] });
        expect(form.getValue('a')).toBe('');
        form.setValues({ a: 'x' });
        expect(form.values.value).toEqual({ a: 'x' });
        form.setError('a', 'Nope');
        expect(form.errors.value).toEqual({ a: ['Nope'] });
        form.clearErrors();
        form.resetField('a');
        expect(form.values.value).toEqual({ a: '' });
        form.setErrors({ a: 'Again' });
        expect(await form.validateField('a')).toBe(false);
        const list = form.array('list');
        list.append(1);
        expect(form.values.value).toEqual({ a: '', list: [1] });
        expect(form.submitting.value).toBe(false);
        expect(form.submitted.value).toBe(false);
        expect(form.submitFailed.value).toBe(false);
        expect(form.validating.value).toBe(false);
        expect(createForm).toBeTypeOf('function');
    });

    it('takes its messages from the Vitral locale', async () => {
        let form!: ReturnType<typeof useForm>;
        mountVt(
            defineComponent({
                setup() {
                    form = useForm<Record<string, Any>>({ initialValues: { a: '' }, rules: { a: rules.required() } });
                    return () => null;
                }
            }),
            {},
            { theme: 'none', locale: ptBR }
        );
        await form.validate();
        expect(form.errors.value.a).toEqual(['Preencha este campo.']);
    });
});

describe('useFormField', () => {
    it('throws outside a field', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(() => mountVt(defineComponent({ setup: () => (useFormField(), () => null) }))).toThrow(/Form\.Field/);
        warn.mockRestore();
    });
});

describe('Form accessibility', () => {
    const SignUp = () =>
        h(FormRoot, { initialValues: { name: '', email: '', plan: null, terms: false }, 'aria-label': 'Sign up' }, () => [
            h(FormSummary),
            field('name', { label: 'Name', required: true, description: 'As it should appear on the badge.' }, () => h(InputText)),
            field('email', { label: 'Email', required: true, rules: rules.email() }, () => h(InputText, { type: 'email' })),
            field('plan', { label: 'Plan', required: true }, () => h(RadioGroup, null, () => [h(RadioButton, { value: 'free', label: 'Free' }), h(RadioButton, { value: 'pro', label: 'Pro' })])),
            field('terms', { required: true }, () => h(Checkbox, { label: 'I accept the terms' })),
            h(FormSubmit, { label: 'Create account' })
        ]);

    it('has no violations when idle, invalid, and with the summary showing', async () => {
        const wrapper = mountForm(SignUp);
        await settle();
        await expectNoA11yViolations();
        await submit(wrapper);
        expect(wrapper.find('.vt-form-summary').exists()).toBe(true);
        expect(wrapper.findAll('[aria-invalid="true"]').length).toBe(4);
        await expectNoA11yViolations();
        // Every reference points at an element that exists.
        for (const el of Array.from(document.querySelectorAll('[aria-describedby], [aria-errormessage], [aria-labelledby]'))) {
            for (const attr of ['aria-describedby', 'aria-errormessage', 'aria-labelledby']) {
                for (const id of (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)) expect(document.getElementById(id), `${attr}=${id}`).not.toBeNull();
            }
        }
    });

    it('focuses the first invalid field in page order when there is no summary', async () => {
        const wrapper = mountForm(() =>
            h(FormRoot, { initialValues: { a: 'ok', b: '', c: '' } }, () => [
                field('a', { label: 'A', required: true }, () => h(InputText)),
                field('b', { label: 'B', required: true }, () => h(InputText)),
                field('c', { label: 'C', required: true }, () => h(InputText))
            ])
        );
        await submit(wrapper);
        expect(document.activeElement).toBe(wrapper.findAll('input')[1]!.element);
    });

    it('leaves focus alone when told to', async () => {
        const wrapper = mountForm(() => h(FormRoot, { initialValues: { a: '' }, focusOnInvalid: false }, () => [h(FormSummary), field('a', { label: 'A', required: true }, () => h(InputText))]));
        await submit(wrapper);
        expect(document.activeElement).toBe(document.body);
    });
});
