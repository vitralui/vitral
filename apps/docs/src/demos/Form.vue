<script lang="ts">
import type { DemoMeta } from '../demo';
import { href } from '../lib/router';

export const meta: DemoMeta = {
    title: 'Form',
    category: 'Form',
    description:
        'Validation and submission built from parts that wire values, labels, hints and errors to any Vitral control, with rules or a schema.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AsyncValidation from './Form/AsyncValidation.vue';
import BlurOrSubmit from './Form/BlurOrSubmit.vue';
import ErrorSummary from './Form/ErrorSummary.vue';
import EveryControl from './Form/EveryControl.vue';
import FieldArrays from './Form/FieldArrays.vue';
import SignUp from './Form/SignUp.vue';
import WithResolver from './Form/WithResolver.vue';
import WithoutFramework from './Form/WithoutFramework.vue';
</script>

<template>
    <DemoSection
        title="Sign-up"
        description="Built-in rules on each field. Nothing is checked until the first submit; after that each field is checked again as it changes, so a fixed error goes away at once."
    ><SignUp /></DemoSection>

    <DemoSection
        title="Validate on blur or on submit"
        description="`validate-on` says when a field is first checked: `submit` (the default), `blur`, `change` or `input`. Checking on blur tells people early; checking on submit never interrupts them. A field can choose its own."
    ><BlurOrSubmit /></DemoSection>

    <p class="demo-lead">
        Rules cover a field at a time; a schema covers the form. <code>@vitral/forms</code> ships adapters for Zod, Yup, Valibot, Superstruct and anything carrying
        <code>~standard</code> (ArkType, Effect Schema), each written against the smallest shape its library exposes, so the package depends on none of them —
        <a :href="href('/docs/forms')">the whole of it is documented here</a>, including the same form without a framework.
    </p>

    <DemoSection
        title="With a resolver"
        description="A resolver validates every value at once: `zodResolver(schema)`, `yupResolver`, `valibotResolver`, `superstructResolver`, `standardSchemaResolver` or `functionResolver`, on `Form.Root` or on `createForm`. An adapter only needs the shape of the schema — `safeParse`, `validate`, `~standard` — so no schema library is installed here and the one below is written by hand. Cross-field checks (the years) and transforms (the handle is trimmed and lower-cased on submit) come from the schema, and what it transforms is what is submitted."
    ><WithResolver /></DemoSection>

    <DemoSection
        title="Async validation"
        description="A rule may return a promise. Here the name is checked as you type, 300 ms after the last keystroke; a newer check aborts the one still running (its `signal` fires), so a slow answer never overwrites a fresh one. Try “ada” or “admin”."
    ><AsyncValidation /></DemoSection>

    <DemoSection
        title="Field arrays"
        description="`Form.FieldArray` repeats a group: each entry has a stable key and a path to name its fields by, and the slot can append, insert, remove, move and swap. Errors move with their rows. Rules on the list itself show in a `Form.Message` placed directly inside."
    ><FieldArrays /></DemoSection>

    <DemoSection
        title="Error summary"
        description="`Form.Summary` (also `Form.Errors`) appears after a failed submit, above the form: an alert listing every error as a link to its field, which takes focus so a keyboard or screen reader user starts there. The fields’ own messages stay silent meanwhile, so nothing is announced twice."
    ><ErrorSummary /></DemoSection>

    <DemoSection title="Every control" description="One of each Vitral input, each bound by nothing more than being placed inside a `Form.Field`. Submit the empty form to see every one of them invalid."><EveryControl /></DemoSection>

    <DemoSection
        title="Using the form without a framework"
        description="The state, the rules and the async checks are @vitral/forms, which draws nothing and imports no framework; the Form parts are a wrapper over it. createForm() holds the values and the errors, register() says what a field is called and what it has to be, and subscribe() reports every change. The one below binds it to three plain inputs by hand — which is all a React or an Angular adapter would do; its code shows how."
    ><WithoutFramework /></DemoSection>
</template>
