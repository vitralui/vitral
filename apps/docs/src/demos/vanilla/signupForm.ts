// No framework here: `@vitral/forms` is the form's state and its rules, and
// nothing else. It holds no elements and draws nothing — this module binds it
// to three plain inputs by hand, which is all a React or an Angular adapter
// does either.
import { createForm, rules, type FormApi } from '@vitral/forms';

interface Signup {
    email: string;
    password: string;
    confirm: string;
}

export function mountSignupForm(element: HTMLElement, onSubmit: (text: string) => void): FormApi<Signup> {
    const form = createForm<Signup>({
        initialValues: { email: '', password: '', confirm: '' },
        // A field is checked as it is left, and everything is checked on submit.
        validateOn: 'blur'
    });

    form.register('email', { label: 'Email', rules: [rules.required(), rules.email()] });
    form.register('password', { label: 'Password', rules: [rules.required(), rules.minLength(8)] });
    form.register('confirm', { label: 'Repeat the password', rules: [rules.required(), rules.equalsField('password')], deps: ['password'] });

    element.innerHTML = `
        <form novalidate class="vanilla-form" aria-label="Sign up">
            ${['email', 'password', 'confirm']
                .map(
                    (name) => `
                <div class="vanilla-field">
                    <label for="vf-${name}">${form.labelOf(name)}</label>
                    <input id="vf-${name}" name="${name}" type="${name === 'email' ? 'email' : 'password'}"
                           class="vt-field vt-field-input" aria-describedby="vf-${name}-error" />
                    <small id="vf-${name}-error" class="vanilla-error" role="alert"></small>
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
