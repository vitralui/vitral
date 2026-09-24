<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Accessibility',
    section: 'Reference',
    description: 'A condition of a component existing, not a milestone on its way there.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const spec = `it('is a combobox that answers the keyboard', async () => {
    const wrapper = mount(Select, { props: { options, optionLabel: 'name' } });

    await expectNoA11yViolations(wrapper);     // axe, closed
    await press(wrapper, 'ArrowDown');         // opens and marks the first option
    await expectNoA11yViolations(wrapper);     // axe, open

    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.attributes('aria-activedescendant')).toBe(optionId(0));
});`;

const borders = `app.use(Vitral, {
    theme: { preset: Ink, borders: 'strong' }
});

// or at runtime, from anywhere:
const { setBorders } = useTheme();
setBorders('strong');`;
</script>

<template>
    <T k="intro">
        A component is not done until its accessibility works: the role, an accessible name, every state and value that applies, the relations that tie it to its label,
        description and popup, and the keyboard behaviour of the matching
        <a href="https://www.w3.org/WAI/ARIA/apg/patterns/" target="_blank" rel="noreferrer">WAI-ARIA APG pattern</a>.
    </T>

    <T k="spec.title" as="h2">What every spec does</T>
    <ul>
        <T k="spec.axe" as="li">Runs <strong>axe</strong> over the representative states, and for an overlay both closed and open.</T>
        <T k="spec.keyboard" as="li">Drives the <strong>keyboard</strong> through the pattern's keys and asserts what changed.</T>
        <T k="spec.aria" as="li">Asserts the <strong>ARIA attributes</strong>, not only the classes: a test that only sees classes cannot tell a styled div from a control.</T>
    </ul>
    <CodeBlock :code="spec" label="Select.spec.ts" lang="ts" />

    <T k="practice.title" as="h2">What that means in practice</T>
    <ul>
        <T k="practice.fields" as="li">Fields are real controls: <code>&lt;label for&gt;</code>, <code>name</code> and <code>aria-describedby</code> reach them without extra props, because non-class attributes fall through to the control rather than the wrapper.</T>
        <T k="practice.overlays" as="li">Overlays trap focus when modal, return it when they close, and close on Escape or a press outside. Only the topmost one, so a dialog over a dialog behaves.</T>
        <T k="practice.lists" as="li">Lists take type-ahead, Home/End, and <code>aria-activedescendant</code> rather than moving focus inside a popup.</T>
        <T k="practice.toolbars" as="li">Toolbars, tab lists and radio groups are one tab stop with arrow-key movement, as the APG asks.</T>
        <T k="practice.motion" as="li">Anything that animates stops under <code>prefers-reduced-motion: reduce</code>.</T>
        <T k="practice.toasts" as="li">Toasts are live regions (polite, or an alert for a danger), and a <code>life</code> pauses while the card is hovered or focused.</T>
    </ul>

    <T k="contrast.title" as="h2">Contrast, and the one switch it needs</T>
    <T k="contrast.text">
        Text, focus rings and disabled states meet
        <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum" target="_blank" rel="noreferrer">1.4.3</a> and
        <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast" target="_blank" rel="noreferrer">1.4.11</a> in every preset and both schemes, and a test measures it
        rather than trusting the eye: the theme is compiled, each <code>var()</code> chain is followed to a real colour, translucent surfaces are composited over what is behind
        them, and the ratio is computed. A preset that drifts under the bar fails the build.
    </T>
    <T k="contrast.borders">
        One thing is deliberately not on by default. 1.4.11 also asks the <em>border of a field</em> to reach 3:1 against the field, and these presets are drawn with quieter
        edges than that — a line that suggests where a control is rather than outlining it. Both sets ship in the stylesheet; <code>borders: 'strong'</code> switches to the ones
        that meet the criterion, and because it is a mark on <code>&lt;html&gt;</code> and not a recompile it can be flipped at runtime.
    </T>
    <CodeBlock :code="borders" lang="ts" />
    <T k="contrast.menu">The theme menu at the top of this page has the same switch, so every example on the site can be read either way.</T>

    <T k="unstyled.title" as="h2">Unstyled changes none of it</T>
    <T k="unstyled.text">
        <a :href="href('/docs/unstyled')">Unstyled mode</a> drops the classes and keeps every line above. That is the division the library is built on: behaviour and semantics are the
        component, the look is a theme.
    </T>
</template>
