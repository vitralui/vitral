<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Form',
    category: 'Form',
    description:
        'Validation and submission, built from parts: `Form.Root` renders a native form and owns the values, `Form.Field` binds one value to the Vitral control placed inside it: value, name, invalid state, label, hint and error relations. `Form.Summary` lists what is wrong after a failed submit. Rules, async checks and schema resolvers come from `@vitral/forms`, which has no dependencies and no framework in it: resolvers for Zod, Yup, Valibot, Superstruct and Standard Schema, and the same form state without Vue. Errors appear only once a field has been validated; after a failed submit focus moves to the summary or to the first invalid field.'
};
</script>

<script setup lang="ts">
import {
    AutoComplete,
    Button,
    CascadeSelect,
    Checkbox,
    ColorPicker,
    DatePicker,
    Editor,
    Form,
    InputMask,
    InputNumber,
    InputOtp,
    InputText,
    Knob,
    Listbox,
    MultiSelect,
    Password,
    RadioButton,
    RadioGroup,
    Rating,
    rules,
    Select,
    SelectButton,
    Slider,
    Textarea,
    ToggleButton,
    ToggleSwitch,
    TreeSelect,
    zodResolver,
    type FormSubmitEvent,
    type TreeNode
} from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';
import { href } from '../lib/router';

const show = (target: { value: string }) => (event: FormSubmitEvent) => {
    target.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
};

// ---- Sign-up with the built-in rules
const signUp = ref({ name: '', email: '', password: '', confirm: '', website: '', age: null, terms: false });
const signUpResult = ref('');
const onSignUp = show(signUpResult);

// ---- Blur or submit
const onBlurResult = ref('');
const onSubmitResult = ref('');

// ---- A resolver. No schema library is installed here, so this is a tiny
// hand-written schema with the shape Zod's has: `safeParse` returning issues
// with paths, which is all `zodResolver` asks for.
interface Profile {
    handle: string;
    site: string;
    from: number | null;
    to: number | null;
}
const profileSchema = {
    safeParse(input: unknown) {
        const value = input as Profile;
        const issues: { path: (string | number)[]; message: string }[] = [];
        const handle = value.handle.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,15}$/.test(handle)) issues.push({ path: ['handle'], message: 'Use 3 to 15 letters, digits or underscores.' });
        if (value.site && !value.site.startsWith('https://')) issues.push({ path: ['site'], message: 'Use an https:// address.' });
        if (value.from == null) issues.push({ path: ['from'], message: 'Enter the first year.' });
        if (value.from != null && value.to != null && value.to < value.from) issues.push({ path: ['to'], message: 'The last year comes after the first.' });
        return issues.length ? { success: false as const, error: { issues } } : { success: true as const, data: { ...value, handle } };
    }
};
const profileResolver = zodResolver(profileSchema);
const profile = ref<Profile>({ handle: '', site: '', from: null, to: null });
const profileResult = ref('');
const onProfile = show(profileResult);

// ---- Async validation: a fake server that takes a moment to answer.
const takenNames = ['admin', 'root', 'vitral', 'ada', 'grace'];
function wait(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Superseded', 'AbortError'));
        });
    });
}
const available = rules.custom<string>(async (value, { signal }) => {
    if (!value) return true;
    await wait(700, signal);
    return !takenNames.includes(value.toLowerCase()) || `“${value}” is taken. Try another.`;
});
const usernameRules = [rules.required(), rules.pattern(/^[a-z0-9_]+$/i, 'Use letters, digits or underscores.'), available];
const accountResult = ref('');
const onAccount = show(accountResult);

// ---- Field arrays
const trip = ref({ title: 'Team offsite', guests: [{ name: 'Ada Lovelace', email: 'ada@example.com' }, { name: '', email: '' }] });
const tripResult = ref('');
const onTrip = show(tripResult);

// ---- Error summary
const today = new Date();
const countries = [
    { name: 'Brazil', code: 'BR' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Angola', code: 'AO' }
];
const applicationResult = ref('');
const onApplication = show(applicationResult);

// ---- Every control
const cities = [
    { name: 'Recife', code: 'REC' },
    { name: 'Salvador', code: 'SSA' },
    { name: 'Lisboa', code: 'LIS' },
    { name: 'Luanda', code: 'LAD' }
];
const citySuggestions = ref<string[]>([]);
const matchCity = (query: string) => (citySuggestions.value = cities.map((c) => c.name).filter((name) => name.toLowerCase().includes(query.toLowerCase())));
const menu = [
    { label: 'Coffee', items: [{ label: 'Espresso' }, { label: 'Filter' }] },
    { label: 'Tea', items: [{ label: 'Green' }, { label: 'Black' }] }
];
const files: TreeNode[] = [
    { key: 'docs', label: 'Documents', children: [{ key: 'cv', label: 'CV.pdf' }, { key: 'letter', label: 'Letter.docx' }] },
    { key: 'photos', label: 'Photos', children: [{ key: 'beach', label: 'Beach.jpg' }] }
];
const everything = ref({
    text: '',
    notes: '',
    amount: null,
    phone: '',
    code: '',
    secret: '',
    city: null,
    cities: [],
    search: '',
    drink: null,
    file: null,
    listed: null,
    agree: false,
    size: null,
    alerts: false,
    pinned: false,
    view: null,
    volume: 0,
    stars: null,
    level: 0,
    color: null,
    date: null,
    story: ''
});
const everythingResult = ref('');
const onEverything = show(everythingResult);
const positive = rules.custom<number | null>((v) => (v ?? 0) > 0, 'Move it above zero.');
// The editor's value is HTML: an empty paragraph is still empty.
const hasText = rules.custom<string>((html) => !!html?.replace(/<[^>]*>/g, '').trim(), 'Write a few words.');
</script>

<template>
    <DemoSection
        title="Sign-up"
        description="Built-in rules on each field. Nothing is checked until the first submit; after that each field is checked again as it changes, so a fixed error goes away at once."
    >
        <Form.Root v-model="signUp" aria-label="Sign up" style="width: 100%; max-width: 26rem" @submit="onSignUp">
            <Form.Field name="name" label="Full name" required :rules="rules.minLength(2)">
                <InputText autocomplete="name" fluid />
            </Form.Field>
            <Form.Field name="email" label="Email" description="We send the confirmation here." required :rules="rules.email()">
                <InputText type="email" autocomplete="email" fluid />
            </Form.Field>
            <Form.Field name="password" label="Password" required :rules="rules.minLength(8)">
                <Password autocomplete="new-password" toggle-mask fluid />
            </Form.Field>
            <Form.Field name="confirm" label="Repeat the password" required :rules="rules.equalsField('password')">
                <InputText type="password" autocomplete="new-password" fluid />
            </Form.Field>
            <Form.Field name="website" label="Website" :rules="rules.url()">
                <InputText type="url" placeholder="https://" fluid />
            </Form.Field>
            <Form.Field name="age" label="Age" required :rules="[rules.min(18, 'You have to be 18 or older.'), rules.max(120)]">
                <InputNumber :use-grouping="false" />
            </Form.Field>
            <Form.Field name="terms" :rules="rules.required('Accept the terms to go on.')">
                <Checkbox label="I accept the terms of use" />
            </Form.Field>
            <div class="demo-row" style="display: flex; gap: 0.5rem">
                <Form.Submit label="Create account" />
                <Form.Reset label="Start over" />
            </div>
        </Form.Root>
        <pre v-if="signUpResult" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ signUpResult }}</pre>
    </DemoSection>

    <DemoSection
        title="Validate on blur or on submit"
        description="`validate-on` says when a field is first checked: `submit` (the default), `blur`, `change` or `input`. Checking on blur tells people early; checking on submit never interrupts them. A field can choose its own."
    >
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1.5rem; width: 100%">
            <Form.Root :initial-values="{ email: '' }" validate-on="blur" aria-label="Checked on blur" @submit="(e) => (onBlurResult = e.valid ? 'Sent' : 'Fix the address')">
                <Form.Field name="email" label="Email (checked on blur)" required :rules="rules.email()">
                    <InputText type="email" fluid />
                </Form.Field>
                <Form.Submit label="Send" severity="secondary" />
                <span class="demo-hint" aria-live="polite">{{ onBlurResult }}</span>
            </Form.Root>
            <Form.Root :initial-values="{ email: '' }" aria-label="Checked on submit" @submit="(e) => (onSubmitResult = e.valid ? 'Sent' : 'Fix the address')">
                <Form.Field name="email" label="Email (checked on submit)" required :rules="rules.email()">
                    <InputText type="email" fluid />
                </Form.Field>
                <Form.Submit label="Send" severity="secondary" />
                <span class="demo-hint" aria-live="polite">{{ onSubmitResult }}</span>
            </Form.Root>
        </div>
    </DemoSection>

    <p class="demo-lead">
        Rules cover a field at a time; a schema covers the form. <code>@vitral/forms</code> ships adapters for Zod, Yup, Valibot, Superstruct and anything carrying
        <code>~standard</code> (ArkType, Effect Schema), each written against the smallest shape its library exposes, so the package depends on none of them —
        <a :href="href('/docs/forms')">the whole of it is documented here</a>, including the same form without a framework.
    </p>

    <DemoSection
        title="With a resolver"
        description="A resolver validates every value at once: `zodResolver(schema)`, `yupResolver`, `valibotResolver`, `superstructResolver`, `standardSchemaResolver` or `functionResolver`, on `Form.Root` or on `createForm`. An adapter only needs the shape of the schema — `safeParse`, `validate`, `~standard` — so no schema library is installed here and the one below is written by hand. Cross-field checks (the years) and transforms (the handle is trimmed and lower-cased on submit) come from the schema, and what it transforms is what is submitted."
    >
        <Form.Root v-model="profile" :resolver="profileResolver" aria-label="Profile" style="width: 100%; max-width: 26rem" @submit="onProfile">
            <Form.Field name="handle" label="Handle">
                <InputText fluid>
                    <template #prefix>@</template>
                </InputText>
            </Form.Field>
            <Form.Field name="site" label="Site">
                <InputText type="url" placeholder="https://" fluid />
            </Form.Field>
            <div style="display: flex; gap: 1rem">
                <Form.Field name="from" label="Active since">
                    <InputNumber :use-grouping="false" />
                </Form.Field>
                <Form.Field name="to" label="Until">
                    <InputNumber :use-grouping="false" />
                </Form.Field>
            </div>
            <Form.Submit label="Save profile" />
        </Form.Root>
        <pre v-if="profileResult" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ profileResult }}</pre>
    </DemoSection>

    <DemoSection
        title="Async validation"
        description="A rule may return a promise. Here the name is checked as you type, 300 ms after the last keystroke; a newer check aborts the one still running (its `signal` fires), so a slow answer never overwrites a fresh one. Try “ada” or “admin”."
    >
        <Form.Root :initial-values="{ username: '' }" validate-on="input" aria-label="Choose a username" style="width: 100%; max-width: 26rem" @submit="onAccount">
            <Form.Field v-slot="{ validating, invalid, value }" name="username" label="Username" :rules="usernameRules" :debounce="300">
                <InputText autocomplete="username" fluid />
                <span class="demo-hint" aria-live="polite">{{ validating ? 'Checking…' : value && !invalid ? 'Available.' : '' }}</span>
            </Form.Field>
            <Form.Submit label="Claim it" />
        </Form.Root>
        <pre v-if="accountResult" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ accountResult }}</pre>
    </DemoSection>

    <DemoSection
        title="Field arrays"
        description="`Form.FieldArray` repeats a group: each entry has a stable key and a path to name its fields by, and the slot can append, insert, remove, move and swap. Errors move with their rows. Rules on the list itself show in a `Form.Message` placed directly inside."
    >
        <Form.Root v-model="trip" aria-label="Trip" style="width: 100%; max-width: 40rem" @submit="onTrip">
            <Form.Field name="title" label="Trip" required>
                <InputText fluid />
            </Form.Field>
            <Form.FieldArray v-slot="{ fields, append, remove, move }" name="guests" label="Guests" :rules="rules.minLength(1, 'Add at least one guest.')">
                <div v-for="guest in fields" :key="guest.key" style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.75rem">
                    <Form.Field :name="`${guest.name}.name`" :label="`Guest ${guest.index + 1}`" required>
                        <InputText autocomplete="off" />
                    </Form.Field>
                    <Form.Field :name="`${guest.name}.email`" :label="`Email of guest ${guest.index + 1}`" required :rules="rules.email()">
                        <InputText type="email" autocomplete="off" />
                    </Form.Field>
                    <div style="display: flex; gap: 0.25rem; padding-top: 1.4rem">
                        <Button icon="arrowUp" variant="text" severity="secondary" :disabled="guest.first" :aria-label="`Move guest ${guest.index + 1} up`" @click="move(guest.index, guest.index - 1)" />
                        <Button icon="arrowDown" variant="text" severity="secondary" :disabled="guest.last" :aria-label="`Move guest ${guest.index + 1} down`" @click="move(guest.index, guest.index + 1)" />
                        <Button icon="trash" variant="text" severity="danger" :aria-label="`Remove guest ${guest.index + 1}`" @click="remove(guest.index)" />
                    </div>
                </div>
                <Form.Message />
                <div>
                    <Button label="Add a guest" icon="plus" variant="outlined" severity="secondary" @click="append({ name: '', email: '' })" />
                </div>
            </Form.FieldArray>
            <Form.Submit label="Book" />
        </Form.Root>
        <pre v-if="tripResult" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ tripResult }}</pre>
    </DemoSection>

    <DemoSection
        title="Error summary"
        description="`Form.Summary` (also `Form.Errors`) appears after a failed submit, above the form: an alert listing every error as a link to its field, which takes focus so a keyboard or screen reader user starts there. The fields’ own messages stay silent meanwhile, so nothing is announced twice."
    >
        <Form.Root :initial-values="{ fullName: '', email: '', born: null, country: null, plan: null }" aria-label="Application" style="width: 100%; max-width: 30rem" @submit="onApplication">
            <Form.Summary />
            <Form.Field name="fullName" label="Full name" required>
                <InputText autocomplete="name" fluid />
            </Form.Field>
            <Form.Field name="email" label="Email" required :rules="rules.email()">
                <InputText type="email" autocomplete="email" fluid />
            </Form.Field>
            <Form.Field name="born" label="Date of birth" description="For example, 27/03/1990." required :rules="rules.max(today, 'The date has to be in the past.')">
                <DatePicker />
            </Form.Field>
            <Form.Field name="country" label="Country" required>
                <Select :options="countries" option-label="name" option-value="code" placeholder="Choose a country" fluid />
            </Form.Field>
            <Form.Field name="plan" label="Plan" required>
                <RadioGroup orientation="horizontal">
                    <RadioButton value="basic" label="Basic" />
                    <RadioButton value="team" label="Team" />
                </RadioGroup>
            </Form.Field>
            <Form.Submit label="Apply" />
        </Form.Root>
        <pre v-if="applicationResult" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ applicationResult }}</pre>
    </DemoSection>

    <DemoSection title="Every control" description="One of each Vitral input, each bound by nothing more than being placed inside a `Form.Field`. Submit the empty form to see every one of them invalid.">
        <Form.Root v-model="everything" aria-label="Every control" style="width: 100%" @submit="onEverything">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1.25rem 1.5rem; align-items: start">
                <Form.Field name="text" label="InputText" required>
                    <InputText fluid />
                </Form.Field>
                <Form.Field name="amount" label="InputNumber" required>
                    <InputNumber mode="currency" currency="BRL" locale="pt-BR" fluid />
                </Form.Field>
                <Form.Field name="phone" label="InputMask" required>
                    <InputMask mask="(99) 99999-9999" fluid />
                </Form.Field>
                <Form.Field name="code" label="InputOtp" required :rules="rules.minLength(4, 'Enter all four digits.')">
                    <InputOtp :length="4" integer-only />
                </Form.Field>
                <Form.Field name="secret" label="Password" required>
                    <Password :feedback="false" toggle-mask fluid />
                </Form.Field>
                <Form.Field name="city" label="Select" required>
                    <Select :options="cities" option-label="name" option-value="code" placeholder="Choose" fluid />
                </Form.Field>
                <Form.Field name="cities" label="MultiSelect" required>
                    <MultiSelect :options="cities" option-label="name" option-value="code" placeholder="Choose some" fluid />
                </Form.Field>
                <Form.Field name="search" label="AutoComplete" required>
                    <AutoComplete :suggestions="citySuggestions" fluid @complete="matchCity($event.query)" />
                </Form.Field>
                <Form.Field name="drink" label="CascadeSelect" required>
                    <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Pick a drink" fluid />
                </Form.Field>
                <Form.Field name="file" label="TreeSelect" required>
                    <TreeSelect :options="files" placeholder="Pick a file" fluid />
                </Form.Field>
                <Form.Field name="date" label="DatePicker" required>
                    <DatePicker fluid />
                </Form.Field>
                <Form.Field name="color" label="ColorPicker" required>
                    <ColorPicker />
                </Form.Field>
                <Form.Field name="listed" label="Listbox" required>
                    <Listbox :options="cities" option-label="name" option-value="code" scroll-height="9rem" />
                </Form.Field>
                <Form.Field name="notes" label="Textarea" required>
                    <Textarea :rows="3" fluid />
                </Form.Field>
                <Form.Field name="size" label="RadioGroup" required>
                    <RadioGroup>
                        <RadioButton value="s" label="Small" />
                        <RadioButton value="l" label="Large" />
                    </RadioGroup>
                </Form.Field>
                <Form.Field name="view" label="SelectButton" required>
                    <SelectButton :options="['Day', 'Week', 'Month']" />
                </Form.Field>
                <Form.Field name="agree" required>
                    <Checkbox label="Checkbox" />
                </Form.Field>
                <Form.Field name="alerts" label="ToggleSwitch" :rules="rules.required('Turn it on.')">
                    <ToggleSwitch />
                </Form.Field>
                <Form.Field name="pinned" label="ToggleButton" :rules="rules.required('Press it.')">
                    <ToggleButton on-label="Pinned" off-label="Pin" />
                </Form.Field>
                <Form.Field name="stars" label="Rating" required>
                    <Rating />
                </Form.Field>
                <Form.Field name="volume" label="Slider" :rules="positive">
                    <Slider style="width: 100%" />
                </Form.Field>
                <Form.Field name="level" label="Knob" :rules="positive">
                    <Knob :size="96" />
                </Form.Field>
                <Form.Field name="story" label="Editor" required :rules="hasText" style="grid-column: 1 / -1">
                    <Editor :toolbar="[['bold', 'italic'], ['bulletList', 'link']]" style="width: 100%" />
                </Form.Field>
            </div>
            <div style="display: flex; gap: 0.5rem">
                <Form.Submit label="Submit everything" />
                <Form.Reset label="Reset" />
            </div>
        </Form.Root>
        <pre v-if="everythingResult" class="demo-output" style="margin: 0; font-size: 0.75rem; max-height: 16rem; overflow: auto; width: 100%" tabindex="0" aria-label="Submitted values">{{ everythingResult }}</pre>
    </DemoSection>
</template>
