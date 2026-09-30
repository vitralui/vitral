<script setup lang="ts">
import { editorFormulas, loadMath, renderMathIn } from '@vitral/core';
import { Button, Editor, SelectButton, type EditorMathOptions } from '@vitral/vue';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// An exam, with its formulas given as their source alone: that is all the
// editor needs to be handed.
const text = ref(
    '<h2>Mathematics — test 3</h2>' +
        '<p>1. Solve <span data-math="x^2 - 5x + 6 = 0"></span> and say which root is the larger.</p>' +
        '<p>2. Simplify <span data-math="\\frac{6a^2 b}{3ab}" data-display="true"></span></p>' +
        '<p>3. The mean of the marks is <span data-math="\\overline{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i"></span>. Find it for 6, 8 and 10.</p>'
);

// How the model's HTML carries a formula: with its drawing, or as its source.
const output = ref<'drawing' | 'source'>('drawing');
const math = computed<EditorMathOptions>(() => ({ output: output.value }));

const editor = ref<InstanceType<typeof Editor> | null>(null);
const page = ref<HTMLElement | null>(null);
const formulas = ref<string[]>([]);
const sizes = ref({ drawing: 0, source: 0 });

async function read() {
    const instance = editor.value;
    if (!instance?.editor) return;
    // The formulas as strings: what a search index, a marking script or another system wants.
    formulas.value = editorFormulas(instance.editor.state.doc).map((formula) => formula.latex);
    // Either HTML can be asked for, whatever the model holds. The drawings need the renderer, which
    // the first formula shown sends for: waiting on it here covers a document read before it has come.
    await loadMath();
    sizes.value = { drawing: instance.getHTML({ math: 'drawing' }).length, source: instance.getHTML({ math: 'source' }).length };
    // A page that shows the document without the editor: the small HTML goes in, and its formulas are drawn from their source.
    if (page.value) {
        page.value.innerHTML = instance.getHTML({ math: 'source' });
        await renderMathIn(page.value);
    }
}

onMounted(() => nextTick(read));
watch([text, output], () => nextTick(read));

const kb = (characters: number) => `${(characters / 1024).toFixed(1)} KB`;

// The HTML with the drawings prints as it looks: into a frame of its own, and
// the browser's print dialog saves it as a PDF.
function print() {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
    frame.srcdoc = `<!doctype html><meta charset="utf-8"><title>Test</title><style>body{font:16px/1.7 system-ui,sans-serif;margin:2.5rem;color:#111}</style>${editor.value?.getHTML({ math: 'drawing' }) ?? ''}`;
    frame.onload = () => {
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
}
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem">
            <SelectButton v-model="output" :options="['drawing', 'source']" label="How the model's HTML carries a formula" :allow-empty="false" />
            <Button label="Print or save as PDF" icon="download" size="small" variant="outlined" severity="secondary" @click="print" />
        </div>
        <Editor ref="editor" v-model="text" :math="math" aria-label="Exam" style="width: 100%" />
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 1rem; width: 100%">
            <div style="display: flex; flex-direction: column; gap: 0.375rem; min-width: 0">
                <strong style="font-size: 0.8125rem">The model (v-model), {{ kb(text.length) }}</strong>
                <pre class="demo-output" aria-label="The model's HTML" tabindex="0" style="margin: 0; max-height: 14rem; overflow: auto; white-space: pre-wrap; word-break: break-all; font-size: 0.6875rem">{{ text }}</pre>
                <small style="color: var(--vt-text-muted-color)">With drawings: {{ kb(sizes.drawing) }} · source alone: {{ kb(sizes.source) }}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.375rem; min-width: 0">
                <strong style="font-size: 0.8125rem">The formulas, as strings</strong>
                <pre class="demo-output" aria-label="The formulas as LaTeX" tabindex="0" style="margin: 0; max-height: 14rem; overflow: auto; white-space: pre-wrap; font-size: 0.75rem">{{ formulas.join('\n') }}</pre>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.375rem; min-width: 0">
                <strong style="font-size: 0.8125rem">A page without the editor</strong>
                <div ref="page" aria-label="The document, shown without the editor" style="padding: 0.75rem 1rem; border: 1px solid var(--vt-content-border-color); border-radius: 0.5rem; max-height: 14rem; overflow: auto; line-height: 1.7" />
                <small style="color: var(--vt-text-muted-color)">The source-only HTML, drawn with renderMathIn</small>
            </div>
        </div>
    </div>
</template>
