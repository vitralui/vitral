<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Accessibility',
    section: 'Reference',
    description: 'A condition of a component existing, not a milestone on its way there.'
};
</script>

<script setup lang="ts">
import CodeBlock from '../parts/CodeBlock.vue';

const spec = `it('is a combobox that answers the keyboard', async () => {
    const wrapper = mount(Select, { props: { options, optionLabel: 'name' } });

    await expectNoA11yViolations(wrapper);     // axe, closed
    await press(wrapper, 'ArrowDown');         // opens and marks the first option
    await expectNoA11yViolations(wrapper);     // axe, open

    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.attributes('aria-activedescendant')).toBe(optionId(0));
});`;
</script>

<template>
    <p>
        A component is not done until it has working accessibility. Not “accessible enough to ship and fix later” — the role, an accessible name, every state and value that
        applies, the relations that tie it to its label, description and popup, and the keyboard behaviour of the matching
        <a href="https://www.w3.org/WAI/ARIA/apg/patterns/" target="_blank" rel="noreferrer">WAI-ARIA APG pattern</a>.
    </p>

    <h2>What every spec does</h2>
    <ul>
        <li>Runs <strong>axe</strong> over the representative states — for an overlay, both closed and open.</li>
        <li>Drives the <strong>keyboard</strong> through the pattern's keys and asserts what changed.</li>
        <li>Asserts the <strong>ARIA attributes</strong>, not only the classes: a test that only sees classes cannot tell a styled div from a control.</li>
    </ul>
    <CodeBlock :code="spec" label="Select.spec.ts" lang="ts" />

    <h2>What that buys the reader</h2>
    <ul>
        <li>Fields are real controls: <code>&lt;label for&gt;</code>, <code>name</code> and <code>aria-describedby</code> reach them without extra props, because non-class attributes fall through to the control rather than the wrapper.</li>
        <li>Overlays trap focus when modal, return it when they close, and close on Escape or a press outside — the topmost one only, so a dialog over a dialog behaves.</li>
        <li>Lists take type-ahead, Home/End, and <code>aria-activedescendant</code> rather than moving focus inside a popup.</li>
        <li>Toolbars, tab lists and radio groups are one tab stop with arrow-key movement, as the APG asks.</li>
        <li>Anything that animates stops under <code>prefers-reduced-motion: reduce</code>.</li>
        <li>Toasts are live regions — polite, or an alert for a danger — and a <code>life</code> pauses while the card is hovered or focused.</li>
    </ul>

    <h2>Unstyled changes none of it</h2>
    <p>
        <a href="#/docs/unstyled">Unstyled mode</a> drops the classes and keeps every line above. That is the division the library is built on: behaviour and semantics are the
        component, the look is a theme.
    </p>
</template>
