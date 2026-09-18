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

const adapters = [
    { name: 'zodResolver', library: 'Zod 3 and 4', needs: '`safeParse`, and `safeParseAsync` when the schema has async refinements', transforms: 'Yes' },
    { name: 'yupResolver', library: 'Yup', needs: '`validate`, called with `abortEarly: false`', transforms: 'Yes, the cast value' },
    { name: 'valibotResolver', library: 'Valibot', needs: '`~standard`, or the `safeParse` you hand it', transforms: 'Yes' },
    { name: 'superstructResolver', library: 'Superstruct', needs: '`validate`, which returns `[error, value]`', transforms: 'With `coerce`' },
    { name: 'standardSchemaResolver', library: 'ArkType, Effect Schema, anything with `~standard`', needs: '`~standard.validate`', transforms: 'Yes' },
    { name: 'functionResolver', library: 'your own function', needs: 'nothing', transforms: 'No' }
];
</script>

<template>
    <p>
        <code>@vitral/forms</code> is the form layer as a package of its own: values, touched and dirty state, errors, submission, field arrays and nested paths, with no
        dependencies and no framework in it. The <a :href="href('/components/form')">Form component</a> is a thin binding over it, so everything on this page is the same
        under Vue, under another framework, or under none.
    </p>

    <h2>Without a framework</h2>
    <p>
        The form is an object you subscribe to. It owns the values and the errors; you own the markup and decide what to do when the state changes. That is what makes it
        reusable: a React binding, a Svelte store or a hand-written page all sit on the same API.
    </p>
    <CodeBlock :code="standalone" language="ts" />

    <h2>Rules</h2>
    <p>
        Rules are per-field checks, declared in one place. They run on the trigger the form is configured for — <code>submit</code> by default, then on every input once a
        field has been validated once, so an error clears as it is fixed. Their messages come from the locale, so a form in Portuguese says so without being told twice.
    </p>
    <CodeBlock :code="ruleList" language="ts" />

    <h2>Schema validators</h2>
    <p>
        A resolver validates the whole form in one call, which is what a schema library is for. Each adapter is written against the smallest shape its library exposes —
        <code>safeParse</code>, <code>validate</code>, <code>~standard</code> — so <code>@vitral/forms</code> depends on none of them, and none of them is bundled unless you
        import it. Rules, <code>validate</code> and a resolver can be used at once: their errors are merged by path.
    </p>
    <CodeBlock :code="zod" language="ts" />
    <CodeBlock :code="yup" language="ts" />
    <CodeBlock :code="valibot" language="ts" />
    <CodeBlock :code="superstruct" language="ts" />
    <CodeBlock :code="standard" language="ts" />
    <p>And when the check is a few lines rather than a schema:</p>
    <CodeBlock :code="fn" language="ts" />

    <h2>What each adapter needs</h2>
    <div class="api-scroll">
        <table class="api-table">
            <thead>
                <tr>
                    <th>Adapter</th>
                    <th>Library</th>
                    <th>What it calls</th>
                    <th>Transforms reach the submitted values</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in adapters" :key="row.name">
                    <td><code>{{ row.name }}</code></td>
                    <td class="doc">{{ row.library }}</td>
                    <td class="doc">{{ row.needs }}</td>
                    <td class="doc">{{ row.transforms }}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <p>
        Every adapter is asynchronous as far as the form is concerned, and a validation that a newer one replaces is aborted through the <code>signal</code> it is given. An
        issue's path is read the way each library reports it — a dotted string, an array of keys, a list of segments — and flattened to <code>address.city</code>, which is
        the path a field is registered under.
    </p>

    <h2>Errors from a server</h2>
    <p>
        A server's answer is validation too. <code>normalizeErrors</code> takes it in whatever shape it arrives and flattens it to paths; <code>setErrors</code> puts it on
        the form, and those paths count as validated, so the messages show at once.
    </p>
    <CodeBlock :code="server" language="ts" />

    <h2>In a Vue form</h2>
    <p>
        Under Vue the same resolver goes on <code>Form.Root</code>, and the fields bind themselves: a control inside a <code>Form.Field</code> takes its value, its name, its
        invalid state and the relations between its label, hint and error message.
    </p>
    <CodeBlock :code="vue" language="vue" />
    <p>
        The <a :href="href('/components/form')">Form component page</a> shows it running, with field arrays, async checks and a summary that takes focus after a failed
        submit.
    </p>
</template>
