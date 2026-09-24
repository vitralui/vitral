<script setup lang="ts">
import { createForm, rules, type FormApi } from '@vitral/forms';
import { StackPanel } from '@vitral/vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

// No framework here: `@vitral/forms` is the form's state and its rules, and
// nothing else. It holds no elements and draws nothing — this function binds it
// to three plain inputs by hand, which is all a React or an Angular adapter
// does either. Vue only gives it an element to draw into.
interface Signup {
    email: string;
    password: string;
    confirm: string;
}

function mountSignupForm(element: HTMLElement, onSubmit: (text: string) => void): FormApi<Signup> {
    const form = createForm<Signup>({
        initialValues: { email: '', password: '', confirm: '' },
        // A field is checked as it is left, and everything is checked on submit.
        validateOn: 'blur'
    });

    form.register('email', { label: 'Email', rules: [rules.required(), rules.email()] });
    form.register('password', { label: 'Password', rules: [rules.required(), rules.minLength(8)] });
    form.register('confirm', { label: 'Repeat the password', rules: [rules.required(), rules.equalsField('password')], deps: ['password'] });

    element.innerHTML = `
        <form novalidate class="signup-form" aria-label="Sign up">
            ${['email', 'password', 'confirm']
                .map(
                    (name) => `
                <div class="signup-field">
                    <label for="vf-${name}">${form.labelOf(name)}</label>
                    <input id="vf-${name}" name="${name}" type="${name === 'email' ? 'email' : 'password'}"
                           class="vt-field vt-field-input" aria-describedby="vf-${name}-error" />
                    <small id="vf-${name}-error" class="signup-error" role="alert"></small>
                </div>`
                )
                .join('')}
            <button type="submit" class="vt-button">Create the account</button>
        </form>`;

    const inputs = [...element.querySelectorAll<HTMLInputElement>('input')];
    for (const input of inputs) {
        input.addEventListener('input', () => form.setValue(input.name, input.value));
        input.addEventListener('blur', () => form.blur(input.name));
    }

    // The form says what changed; the page decides what that looks like.
    form.subscribe((state) => {
        for (const input of inputs) {
            const error = state.validated[input.name] ? form.getError(input.name) : undefined;
            input.setAttribute('aria-invalid', error ? 'true' : 'false');
            element.querySelector(`#vf-${input.name}-error`)!.textContent = error ?? '';
        }
    });

    element.querySelector('form')!.addEventListener('submit', (event) => {
        event.preventDefault();
        void form.submit(
            (values) => onSubmit(`Submitted ${values.email}`),
            () => onSubmit('Nothing was submitted: fix the fields above.')
        );
    });

    return form;
}

const host = ref<HTMLElement | null>(null);
const said = ref('Nothing submitted yet.');
let form: FormApi<Signup> | null = null;

onMounted(() => (form = mountSignupForm(host.value!, (text) => (said.value = text))));
onBeforeUnmount(() => form?.destroy());
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div ref="host" style="width: 100%; max-width: 26rem" />
        <small style="color: var(--vt-text-muted-color)">{{ said }}</small>
    </StackPanel>
</template>

<!-- Not scoped: these elements are written by the function above, not by the template. -->
<style>
.signup-form {
    display: grid;
    gap: 0.875rem;
    justify-items: start;
}

.signup-field {
    display: grid;
    gap: 0.375rem;
    width: 100%;
}

.signup-field > label {
    font-size: 0.8125rem;
    font-weight: 500;
}

.signup-error {
    font-size: 0.75rem;
    min-height: 1em;
    color: var(--vt-danger-color);
}
</style>
