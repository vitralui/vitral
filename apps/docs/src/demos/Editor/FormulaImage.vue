<script setup lang="ts">
import { renderMath, renderMathDataUri, renderMathPng } from '@vitral/core';
import { Button, InputNumber, InputText, Label } from '@vitral/vue';
import { ref, watch } from 'vue';

// A formula with no editor around it: from its source to a drawing that
// stands on its own, for whatever builds the PDF of an exam.
const latex = ref('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
const fontSize = ref(28);
const color = ref('#111827');

const image = ref('');
const svg = ref('');

watch(
    [latex, fontSize, color],
    async () => {
        const options = { display: true, fontSize: fontSize.value || 16, color: color.value };
        // The drawing as a file: a size in pixels and a colour of its own.
        svg.value = await renderMath(latex.value, options);
        // The same, as an address an <img> takes.
        image.value = await renderMathDataUri(latex.value, options);
    },
    { immediate: true }
);

function save(name: string, blob: Blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const saveSvg = () => save('formula.svg', new Blob([svg.value], { type: 'image/svg+xml' }));
// A picture, for what does not take drawings: three pixels for each one, so it prints sharp.
const savePng = async () => save('formula.png', await renderMathPng(latex.value, { display: true, fontSize: fontSize.value || 16, color: color.value, scale: 3, background: '#ffffff' }));
const copy = () => navigator.clipboard?.writeText(latex.value);
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; align-items: end; gap: 0.75rem">
            <div style="display: flex; flex-direction: column; gap: 0.375rem; flex: 1 1 18rem">
                <Label for="fx-latex">Formula, in LaTeX</Label>
                <InputText id="fx-latex" v-model="latex" fluid spellcheck="false" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.375rem">
                <Label for="fx-size">Size, in pixels</Label>
                <InputNumber id="fx-size" v-model="fontSize" :min="8" :max="96" style="width: 7rem" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.375rem">
                <Label for="fx-color">Colour</Label>
                <InputText id="fx-color" v-model="color" style="width: 7rem" spellcheck="false" />
            </div>
        </div>
        <!-- An ordinary image: the formula is a file now, and has nothing of the page in it. -->
        <div style="display: flex; align-items: center; justify-content: center; min-height: 6rem; padding: 1rem; overflow: auto; background: #ffffff; border: 1px solid var(--vt-content-border-color); border-radius: 0.5rem">
            <img v-if="image" :src="image" :alt="latex" />
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            <Button label="Download SVG" icon="download" size="small" @click="saveSvg" />
            <Button label="Download PNG" icon="download" size="small" variant="outlined" @click="savePng" />
            <Button label="Copy LaTeX" icon="copy" size="small" variant="text" severity="secondary" @click="copy" />
        </div>
        <pre class="demo-output" aria-label="The SVG" tabindex="0" style="margin: 0; max-height: 8rem; overflow: auto; white-space: pre-wrap; word-break: break-all; font-size: 0.6875rem">{{ svg }}</pre>
    </div>
</template>
