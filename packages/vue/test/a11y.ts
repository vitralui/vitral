import axe from 'axe-core';

/**
 * Runs axe over the document and fails with a readable report. Colour contrast
 * is off because jsdom does not compute colours; the page-level rules are off
 * because a spec mounts a component, not a page.
 */
export async function expectNoA11yViolations(root: Element = document.body): Promise<void> {
    const results = await axe.run(root, {
        resultTypes: ['violations'],
        rules: {
            'color-contrast': { enabled: false },
            region: { enabled: false },
            'landmark-one-main': { enabled: false },
            'page-has-heading-one': { enabled: false }
        }
    });
    if (results.violations.length === 0) return;
    const report = results.violations
        .map((v) => `${v.id}: ${v.help}\n${v.nodes.map((n) => `  ${n.html}\n    ${n.failureSummary ?? ''}`).join('\n')}`)
        .join('\n\n');
    throw new Error(`Accessibility violations:\n\n${report}`);
}
