<script setup lang="ts">
import { Button, InputNumber, InputText, Select, ToggleSwitch } from '@vitral/vue';
import { computed, h, nextTick, reactive, ref, watch } from 'vue';
import { apiOf, controlOf, memberDoc, type PropControl } from '../lib/api';
import { t } from '../lib/i18n';
import { literal, playgrounds } from '../lib/playgrounds';
import CodeBlock from './CodeBlock.vue';

/**
 * A component with a control for each of its props that can be set by hand,
 * and the code for what is on screen under it. The controls come from the
 * prop's type in `types.ts`, so their choices are the ones the component
 * takes; what the component starts with is in `lib/playgrounds.ts`.
 */
const props = defineProps<{ file: string }>();

const spec = computed(() => playgrounds[props.file]);
const api = computed(() => apiOf(props.file));

type Control = PropControl & { name: string; doc?: string };

const controls = computed<Control[]>(() => {
    const doc = api.value;
    if (!doc || !spec.value) return [];
    return spec.value.controls.flatMap((name) => {
        const member = doc.props.find((prop) => prop.name === name);
        const kind = member && controlOf(props.file, member);
        return member && kind ? [{ name, ...kind, doc: memberDoc(props.file, 'props', member) }] : [];
    });
});

/**
 * What each prop is when it is not given, read from the component's own
 * definition: a switch shows a prop that is on by default as on, a choice
 * shows the value it falls back to, and the code leaves out what is the
 * default anyway. A boolean with no default of its own is false, as Vue casts it.
 */
const defaults = computed<Record<string, unknown>>(() => {
    const declared = ((spec.value?.component as { props?: Record<string, { type?: unknown; default?: unknown }> } | undefined)?.props ?? {}) as Record<
        string,
        { type?: unknown; default?: unknown } | null
    >;
    return Object.fromEntries(
        Object.entries(declared).map(([name, option]) => {
            const fallback = option?.default;
            if (typeof fallback === 'function') return [name, undefined];
            if (fallback === undefined && (option?.type === Boolean || (Array.isArray(option?.type) && option.type[0] === Boolean))) return [name, false];
            return [name, fallback];
        })
    );
});
const shown = (name: string) => values[name] ?? defaults.value[name];

const values = reactive<Record<string, unknown>>({});
const model = ref<unknown>(undefined);
const models = reactive<Record<string, unknown>>({});
function reset() {
    for (const key of Object.keys(values)) delete values[key];
    Object.assign(values, spec.value?.props ?? {});
    model.value = spec.value?.model;
    Object.assign(models, structuredClone(spec.value?.models ?? {}));
    // Set once the copy above has been seen, so filling it in is not a change.
    nextTick(() => (moved.value = false));
}
watch(() => props.file, reset, { immediate: true });

const moved = ref(false);
watch(models, () => (moved.value = true), { deep: true });
const changed = computed(() => moved.value || Object.keys(values).some((key) => values[key] !== spec.value?.props?.[key]) || model.value !== spec.value?.model);

// Drawn again from scratch when a prop changes, so one read only at setup (a grid's columns, a board's size) takes the new value too.
const stageKey = computed(() => JSON.stringify(values));

const live = () => {
    const current = spec.value!;
    const passed: Record<string, unknown> = { ...current.fixed, ...values };
    if (current.model !== undefined) {
        passed.modelValue = model.value;
        passed['onUpdate:modelValue'] = (value: unknown) => (model.value = value);
    }
    for (const name of Object.keys(current.models ?? {})) {
        passed[name] = models[name];
        passed[`onUpdate:${name}`] = (value: unknown) => (models[name] = value);
    }
    return h(current.component, passed, current.children ? { default: current.children } : undefined);
};

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** The code for what is on screen: the props set, as a reader would write them. */
const code = computed(() => {
    const current = spec.value;
    if (!current) return '';
    const attributes: string[] = [];
    if (current.model !== undefined) attributes.push('v-model="value"');
    const named = Object.keys(current.models ?? {});
    if (named.length) attributes.push(named.map((name) => `v-model:${kebab(name)}="${name}"`).join(' '));
    if (current.fixedCode) attributes.push(current.fixedCode);
    for (const control of controls.value) {
        const value = values[control.name];
        if (value === undefined || value === null || value === '' || value === defaults.value[control.name]) continue;
        const name = kebab(control.name);
        if (value === true) attributes.push(name);
        else if (value === false) attributes.push(`:${name}="false"`);
        else if (typeof value === 'number') attributes.push(`:${name}="${value}"`);
        else attributes.push(`${name}="${String(value).replace(/"/g, '&quot;')}"`);
    }
    const open = attributes.length > 2 || attributes.join(' ').length > 60 ? `<${current.tag}\n    ${attributes.join('\n    ')}\n` : `<${current.tag}${attributes.length ? ` ${attributes.join(' ')}` : ''}`;
    const tag = current.childrenCode ? `${open}>\n${current.childrenCode.replace(/^/gm, '    ')}\n</${current.tag}>` : `${open}${open.endsWith('\n') ? '' : ' '}/>`;
    const lines = [`import { ${current.tag}${current.childrenCode?.includes('<Column') ? ', Column' : ''} } from '@vitral/vue';`];
    if (current.model !== undefined || named.length) lines.unshift(`import { ref } from 'vue';`);
    if (current.model !== undefined) lines.push(`\nconst value = ref(${literal(model.value ?? null)});`);
    // What a named v-model starts from, not what it holds now: the code is the page a reader starts from too.
    for (const name of named) lines.push(`\nconst ${name} = ref(${literal(current.models![name])});`);
    if (current.script) lines.push(`\n${current.script}`);
    return `<script setup lang="ts">\n${lines.join('\n')}\n</${'script'}>\n\n<template>\n${tag.replace(/^/gm, '    ')}\n</template>`;
});

const choiceOptions = (control: Control) => control.options!;
</script>

<template>
    <section v-if="spec" id="playground" class="playground">
        <header>
            <h2>{{ t('Try it') }}</h2>
            <p>{{ t('Change the props on the right and see the component, and its code, follow.') }}</p>
        </header>
        <div class="playground-card">
            <div class="playground-main" :class="{ wide: spec.wide }">
                <div class="playground-stage" :class="{ wide: spec.wide }">
                    <component :is="live" :key="stageKey" />
                </div>
                <form class="playground-controls" :aria-label="t('Props')" @submit.prevent>
                    <div class="playground-controls-head">
                        <strong>Props</strong>
                        <Button :label="t('Reset')" icon="rotateLeft" variant="text" size="small" severity="secondary" :disabled="!changed" @click="reset" />
                    </div>
                    <div v-for="control in controls" :key="control.name" class="playground-control" :title="control.doc">
                        <label :for="`pg-${control.name}`"><code>{{ kebab(control.name) }}</code></label>
                        <ToggleSwitch v-if="control.kind === 'boolean'" :id="`pg-${control.name}`" :model-value="!!shown(control.name)" @update:model-value="(value: boolean) => (values[control.name] = value)" />
                        <Select
                            v-else-if="control.kind === 'choice'"
                            :id="`pg-${control.name}`"
                            :model-value="shown(control.name)"
                            :options="choiceOptions(control)"
                            :placeholder="t('(default)')"
                            show-clear
                            size="small"
                            fluid
                            @update:model-value="(value: unknown) => (values[control.name] = value ?? undefined)"
                        />
                        <InputNumber
                            v-else-if="control.kind === 'number'"
                            :id="`pg-${control.name}`"
                            :model-value="shown(control.name) as number | null | undefined"
                            size="small"
                            fluid
                            allow-empty
                            @update:model-value="(value: number | null | undefined) => (values[control.name] = value ?? undefined)"
                        />
                        <InputText
                            v-else
                            :id="`pg-${control.name}`"
                            :model-value="(shown(control.name) as string | undefined) ?? ''"
                            size="small"
                            fluid
                            @update:model-value="(value: string | null | undefined) => (values[control.name] = value || undefined)"
                        />
                    </div>
                </form>
            </div>
            <CodeBlock :code="code" :label="`${spec.tag}.vue`" lang="vue" bare />
        </div>
    </section>
</template>
