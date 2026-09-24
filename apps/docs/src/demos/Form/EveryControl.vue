<script setup lang="ts">
import {
    AutoComplete,
    CascadeSelect,
    Checkbox,
    ColorPicker,
    DatePicker,
    Editor,
    Form,
    InputMask,
    InputNumber,
    InputOtp,
    InputPassword,
    InputText,
    Knob,
    Listbox,
    MultiSelect,
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
    type FormSubmitEvent,
    type TreeNode
} from '@vitral/vue';
import { ref } from 'vue';

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
const result = ref('');
const positive = rules.custom<number | null>((v) => (v ?? 0) > 0, 'Move it above zero.');
// The editor's value is HTML: an empty paragraph is still empty.
const hasText = rules.custom<string>((html) => !!html?.replace(/<[^>]*>/g, '').trim(), 'Write a few words.');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root v-model="everything" aria-label="Every control" style="width: 100%" @submit="onSubmit">
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
                <InputPassword :feedback="false" toggle-mask fluid />
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
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem; max-height: 16rem; overflow: auto; width: 100%" tabindex="0" aria-label="Submitted values">{{ result }}</pre>
</template>
