<script setup lang="ts">
import { Button, Editor } from '@vitral/vue';
import { ref } from 'vue';

// A formula is its LaTeX, in `data-math`. The drawing around it is made from
// that, here and in the HTML the editor hands back.
const text = ref(
    '<h2>Quadratic equations</h2>' +
        '<p>The roots of <span data-math="ax^2 + bx + c = 0"></span> are <span data-math="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" data-display="true"></span></p>' +
        '<p>The mean of a sample is <span data-math="\\overline{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i"></span>, and the area of a circle is <span data-math="\\pi r^2"></span>. Press the 4, the 2 or a letter above to change it where it stands; press the fraction bar to open the whole formula.</p>'
);
const editor = ref<InstanceType<typeof Editor> | null>(null);

// From code: a formula is put in where the caret is.
function insert(latex: string) {
    editor.value?.editor?.run('insertMath', { latex });
    editor.value?.focus();
}

// The HTML carries the formulas as drawings, so it prints as it looks: into a
// frame of its own, and the browser's print dialog saves it as a PDF.
function print() {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
    frame.srcdoc = `<!doctype html><meta charset="utf-8"><title>Document</title><style>body{font:16px/1.6 system-ui,sans-serif;margin:2rem;color:#111}</style>${editor.value?.getHTML() ?? ''}`;
    frame.onload = () => {
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
}
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            <Button label="Pythagoras" icon="plus" size="small" variant="outlined" severity="secondary" @click="insert('a^2 + b^2 = c^2')" />
            <Button label="Fraction" icon="plus" size="small" variant="outlined" severity="secondary" @click="insert('\\frac{1}{2}')" />
            <Button label="Print or save as PDF" icon="download" size="small" variant="text" @click="print" />
        </div>
        <Editor ref="editor" v-model="text" aria-label="Formulas" style="width: 100%" />
    </div>
</template>
