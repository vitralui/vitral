<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Forms and validation',
    section: 'Reference',
    description:
        'Form state, rules and schema validation as a package of its own: `@vitral/forms` has no dependencies and no framework in it, so the same values, errors and submit flow work under Vue, under another framework, or under none. Adapters for Zod, Yup, Valibot, Superstruct, ArkType and anything else that implements Standard Schema.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const standalone = `import { createForm, rules } from '@vitral/forms';

const form = createForm({
    initialValues: { email: '', password: '' },
    rules: {
        email: [rules.required(), rules.email()],
        password: [rules.required(), rules.minLength(8)]
    },
    validateOn: 'blur',
    onSubmit: (values) => api.signIn(values)
});

// The state is a plain object, and every change is published to whoever asks.
form.subscribe((state) => {
    error.textContent = state.errors['email']?.[0] ?? '';
    button.disabled = state.submitting;
});

input.addEventListener('input', () => form.setValue('email', input.value, { trigger: 'input' }));
input.addEventListener('blur', () => form.blur('email'));
element.addEventListener('submit', (event) => {
    event.preventDefault();
    form.submit();
});`;

const ruleList = `import { createForm, rules } from '@vitral/forms';

createForm({
    rules: {
        name: [rules.required(), rules.maxLength(80)],
        age: [rules.min(18, 'You have to be 18.')],
        website: [rules.url()],
        confirm: [rules.equalsField('password', 'The passwords differ.')],
        // Anything else: return a message, or nothing when it is fine.
        handle: [rules.custom(async (value) => ((await taken(value)) ? 'That handle is taken.' : undefined))]
    },
    // Cross-field checks, beside the rules and the resolver.
    validate: (values) => (values.start > values.end ? { end: 'The end comes before the start.' } : null)
});`;

const zod = `import { z } from 'zod';
import { zodResolver } from '@vitral/forms';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    handle: z.string().trim().toLowerCase()
});

const resolver = zodResolver(schema);
// Zod 3 and 4 both fit. Async refinements are awaited unless you pass
// \`{ async: false }\`, and what the schema transforms is what is submitted.`;

const yup = `import * as yup from 'yup';
import { yupResolver } from '@vitral/forms';

const schema = yup.object({
    email: yup.string().required().email(),
    password: yup.string().required().min(8)
});

// Every error, not just the first: the adapter passes \`abortEarly: false\`.
const resolver = yupResolver(schema);`;

const valibot = `import * as v from 'valibot';
import { valibotResolver, standardSchemaResolver } from '@vitral/forms';

const schema = v.object({
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8))
});

// Valibot 1 implements Standard Schema, so either of these works:
const resolver = valibotResolver(schema);
const same = standardSchemaResolver(schema);

// An older schema, or an async one, takes Valibot's own parser:
const asynchronous = valibotResolver(schema, { safeParse: v.safeParseAsync });`;

const superstruct = `import { object, string, size, pattern } from 'superstruct';
import { superstructResolver } from '@vitral/forms';

const struct = object({
    email: pattern(string(), /^[^@\\s]+@[^@\\s]+$/),
    password: size(string(), 8, 72)
});

// \`coerce\` applies the struct's coercions to what is submitted.
const resolver = superstructResolver(struct, { coerce: true });`;

const standard = `import { type } from 'arktype';
import { standardSchemaResolver } from '@vitral/forms';

const schema = type({ email: 'string.email', password: 'string >= 8' });

// ArkType, Valibot 1, Zod 3.24 and later, and anything else carrying
// \`~standard\`: one adapter covers the lot.
const resolver = standardSchemaResolver(schema);`;

const fn = `import { functionResolver } from '@vitral/forms';

// Errors by path, or nested the way the values are. Anything falsy is "fine".
const resolver = functionResolver(async (values, { signal }) => ({
    email: !values.email.includes('@') ? 'That is not an address.' : undefined,
    confirm: values.password !== values.confirm ? 'The passwords differ.' : undefined,
    address: { postcode: (await lookup(values.address.postcode, { signal })) ? undefined : 'No such postcode.' }
}));`;

const server = `import { normalizeErrors, mergeErrors } from '@vitral/forms';

// 422 from the server, in whatever shape it uses:
const fromServer = normalizeErrors({ address: { city: 'Unknown city.' }, email: ['Already registered.'] });
// → { 'address.city': ['Unknown city.'], email: ['Already registered.'] }

form.setErrors(fromServer);
const everything = mergeErrors(form.getState().errors, fromServer);`;

const vue = `<script setup lang="ts">
import { Form, InputText } from '@vitral/vue';
import { zodResolver } from '@vitral/forms';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
const values = ref({ email: '', password: '' });
<\/script>

<template>
    <Form.Root v-model="values" :resolver="zodResolver(schema)" @submit="save">
        <Form.Field name="email" label="Email">
            <InputText type="email" />
        </Form.Field>
        <Form.Field name="password" label="Password">
            <InputText type="password" />
        </Form.Field>
        <Form.Summary />
        <Button type="submit" label="Create account" />
    </Form.Root>
<\/template>`;
</script>

<template>
    <T k="intro">
        <code>@vitral/forms</code> is the form layer as a package of its own: values, touched and dirty state, errors, submission, field arrays and nested paths, with no
        dependencies and no framework in it. The <a :href="href('/components/form')">Form component</a> is a thin binding over it, so everything on this page is the same
        under Vue, under another framework, or under none.
    </T>

    <T k="standalone.title" as="h2">Without a framework</T>
    <T k="standalone.text">
        The form is an object you subscribe to. It owns the values and the errors; you own the markup and decide what to do when the state changes. That is what makes it
        reusable: a React binding, a Svelte store or a hand-written page all sit on the same API.
    </T>
    <CodeBlock :code="standalone" language="ts" />

    <T k="rules.title" as="h2">Rules</T>
    <T k="rules.text">
        Rules are per-field checks, declared in one place. They run on the trigger the form is configured for — <code>submit</code> by default, then on every input once a
        field has been validated once, so an error clears as it is fixed. Their messages come from the locale, so a form in Portuguese says so without being told twice.
    </T>
    <CodeBlock :code="ruleList" language="ts" />

    <T k="schema.title" as="h2">Schema validators</T>
    <T k="schema.text">
        A resolver validates the whole form in one call, which is what a schema library is for. Each adapter is written against the smallest shape its library exposes —
        <code>safeParse</code>, <code>validate</code>, <code>~standard</code> — so <code>@vitral/forms</code> depends on none of them, and none of them is bundled unless you
        import it. Rules, <code>validate</code> and a resolver can be used at once: their errors are merged by path.
    </T>
    <CodeBlock :code="zod" language="ts" />
    <CodeBlock :code="yup" language="ts" />
    <CodeBlock :code="valibot" language="ts" />
    <CodeBlock :code="superstruct" language="ts" />
    <CodeBlock :code="standard" language="ts" />
    <T k="schema.function">And when the check is a few lines rather than a schema:</T>
    <CodeBlock :code="fn" language="ts" />

    <T k="adapters.title" as="h2">What each adapter needs</T>
    <div class="api-scroll">
        <table class="api-table">
            <thead>
                <tr>
                    <T k="adapters.adapter" as="th">Adapter</T>
                    <T k="adapters.library" as="th">Library</T>
                    <T k="adapters.calls" as="th">What it calls</T>
                    <T k="adapters.transforms" as="th">Transforms reach the submitted values</T>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>zodResolver</code></td>
                    <T k="adapters.zod.library" as="td" class="doc">Zod 3 and 4</T>
                    <T k="adapters.zod.calls" as="td" class="doc"><code>safeParse</code>, and <code>safeParseAsync</code> when the schema has async refinements</T>
                    <T k="adapters.yes" as="td" class="doc">Yes</T>
                </tr>
                <tr>
                    <td><code>yupResolver</code></td>
                    <td class="doc">Yup</td>
                    <T k="adapters.yup.calls" as="td" class="doc"><code>validate</code>, called with <code>abortEarly: false</code></T>
                    <T k="adapters.yup.transforms" as="td" class="doc">Yes, the cast value</T>
                </tr>
                <tr>
                    <td><code>valibotResolver</code></td>
                    <td class="doc">Valibot</td>
                    <T k="adapters.valibot.calls" as="td" class="doc"><code>~standard</code>, or the <code>safeParse</code> you hand it</T>
                    <T k="adapters.yes" as="td" class="doc">Yes</T>
                </tr>
                <tr>
                    <td><code>superstructResolver</code></td>
                    <td class="doc">Superstruct</td>
                    <T k="adapters.superstruct.calls" as="td" class="doc"><code>validate</code>, which returns <code>[error, value]</code></T>
                    <T k="adapters.superstruct.transforms" as="td" class="doc">With <code>coerce</code></T>
                </tr>
                <tr>
                    <td><code>standardSchemaResolver</code></td>
                    <T k="adapters.standard.library" as="td" class="doc">ArkType, Effect Schema, anything with <code>~standard</code></T>
                    <td class="doc"><code>~standard.validate</code></td>
                    <T k="adapters.yes" as="td" class="doc">Yes</T>
                </tr>
                <tr>
                    <td><code>functionResolver</code></td>
                    <T k="adapters.function.library" as="td" class="doc">your own function</T>
                    <T k="adapters.function.calls" as="td" class="doc">nothing</T>
                    <T k="adapters.no" as="td" class="doc">No</T>
                </tr>
            </tbody>
        </table>
    </div>
    <T k="adapters.text">
        Every adapter is asynchronous as far as the form is concerned, and a validation that a newer one replaces is aborted through the <code>signal</code> it is given. An
        issue's path is read the way each library reports it — a dotted string, an array of keys, a list of segments — and flattened to <code>address.city</code>, which is
        the path a field is registered under.
    </T>

    <T k="server.title" as="h2">Errors from a server</T>
    <T k="server.text">
        A server's answer is validation too. <code>normalizeErrors</code> takes it in whatever shape it arrives and flattens it to paths; <code>setErrors</code> puts it on
        the form, and those paths count as validated, so the messages show at once.
    </T>
    <CodeBlock :code="server" language="ts" />

    <T k="vue.title" as="h2">In a Vue form</T>
    <T k="vue.text">
        Under Vue the same resolver goes on <code>Form.Root</code>, and the fields bind themselves: a control inside a <code>Form.Field</code> takes its value, its name, its
        invalid state and the relations between its label, hint and error message.
    </T>
    <CodeBlock :code="vue" language="vue" />
    <T k="vue.page">
        The <a :href="href('/components/form')">Form component page</a> shows it running, with field arrays, async checks and a summary that takes focus after a failed
        submit.
    </T>
</template>
