<script setup lang="ts">
import { Form, InputNumber, InputText, zodResolver, type FormSubmitEvent } from '@vitral/vue';
import { ref } from 'vue';

// No schema library is installed here, so this is a tiny hand-written schema
// with the shape Zod's has: `safeParse` returning issues with paths, which is
// all `zodResolver` asks for.
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
const resolver = zodResolver(profileSchema);
const profile = ref<Profile>({ handle: '', site: '', from: null, to: null });
const result = ref('');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root v-model="profile" :resolver="resolver" aria-label="Profile" style="width: 100%; max-width: 26rem" @submit="onSubmit">
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
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ result }}</pre>
</template>
