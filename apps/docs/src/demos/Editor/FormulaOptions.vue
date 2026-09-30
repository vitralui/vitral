<script setup lang="ts">
import { Editor, type EditorMathOptions } from '@vitral/vue';
import { ref } from 'vue';

// The formulas a chemistry class writes, in place of the usual ones; and a
// press on a value opens the panel rather than a box over it.
const chemistry: EditorMathOptions = {
    templates: [
        { id: 'water', label: 'Water', latex: 'H_2O' },
        { id: 'reaction', label: 'Reaction', latex: '2H_2 + O_2 \\to 2H_2O' },
        { id: 'concentration', label: 'Concentration', latex: 'C = \\frac{n}{V}' },
        { id: 'ph', label: 'pH', latex: '\\text{pH} = -\\log \\left[ H^+ \\right]' }
    ],
    inlineEdit: false
};

const lesson = ref('<p>Water is <span data-math="H_2O"></span>, and it forms by <span data-math="2H_2 + O_2 \\to 2H_2O"></span>.</p>');
const fixed = ref('<p>The answer sheet: <span data-math="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"></span>. The text around the formula can be changed; the formula cannot.</p>');
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
        <div style="display: flex; flex-direction: column; gap: 0.375rem">
            <span id="ed-math-own">Formulas of your own, edited in the panel</span>
            <Editor v-model="lesson" :math="chemistry" aria-labelledby="ed-math-own" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.375rem">
            <span id="ed-math-off">Formulas switched off</span>
            <Editor v-model="fixed" :math="false" aria-labelledby="ed-math-off" />
        </div>
    </div>
</template>
