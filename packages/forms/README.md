# @vitral/forms

Form state and validation with no framework and no dependencies. It is what
Vitral's `Form.*` parts run on, and it works on its own.

- Values with nested and array paths, dirty, touched and validated state per field, submit state.
- Validation on submit, blur, change or input, per form and per field, with debounce and revalidation after the first check.
- Async rules with stale runs aborted, cross-field checks, field arrays that carry their items' state.
- Built-in rules (required, min/max length, min/max, pattern, email, url, equals-field, custom).
- Resolvers for Zod, Yup, Valibot, Superstruct, Standard Schema or a plain function, with no dependency on any of them.

```ts
import { createForm, rules, zodResolver } from '@vitral/forms';

const form = createForm({
    initialValues: { email: '' },
    fields: { email: { rules: [rules.required(), rules.email()] } }
});

await form.submit(async (values) => save(values));
```

**[Documentation](https://vitralui.github.io/vitral/#/components/form)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
