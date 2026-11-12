import { describe, expect, it } from 'vitest';
import { history, releaseNotes, type Snapshot } from './changes';

const types = (name: string, props: string, emits = '') =>
    `export interface ${name}Props extends BaseProps {\n${props}\n}\n\nexport type ${name}Emits = {\n${emits}\n};\n`;

function snapshot(version: string, components: Record<string, string>, extra: Partial<Snapshot> = {}): Snapshot {
    return { version, types: new Map(Object.entries(components)), shared: '', touched: new Set(), renamed: new Map(), ...extra };
}

const button = types('Button', '    label?: string;');

describe('the history of changes', () => {
    it('starts at the first release: nothing in it is new', () => {
        expect(history([snapshot('0.1.0', { Button: button })])).toEqual({});
    });

    it('marks a component new in the release its folder appears in, without marking its props', () => {
        const out = history([snapshot('0.1.0', { Button: button }), snapshot('0.1.1', { Button: button, Tag: types('Tag', '    value?: string;') })]);
        expect(out).toEqual({ Tag: { status: 'new', version: '0.1.1' } });
    });

    it('marks a member new where it appears and changed where its type differs', () => {
        const out = history([
            snapshot('0.1.0', { Button: button }),
            snapshot('0.1.1', { Button: types('Button', '    label?: string | number;\n    /** Pill-shaped. */\n    rounded?: boolean;', '    press: [event: Event];') })
        ]);
        expect(out).toEqual({
            Button: {
                status: 'changed',
                version: '0.1.1',
                props: { label: { status: 'changed', version: '0.1.1' }, rounded: { status: 'new', version: '0.1.1' } },
                emits: { press: { status: 'new', version: '0.1.1' } }
            }
        });
    });

    it('does not call a member changed for a new doc comment', () => {
        const out = history([snapshot('0.1.0', { Button: button }), snapshot('0.1.1', { Button: types('Button', '    /** What it says. */\n    label?: string;') })]);
        expect(out).toEqual({});
    });

    it('marks a component changed when a file of its own is', () => {
        const out = history([snapshot('0.1.0', { Button: button }), snapshot('0.1.1', { Button: button }, { touched: new Set(['Button']) })]);
        expect(out).toEqual({ Button: { status: 'changed', version: '0.1.1' } });
    });

    it('follows a rename: the component is changed, not new, and keeps its props', () => {
        const out = history([
            snapshot('0.1.0', { ColorInput: types('ColorInput', '    format?: string;') }),
            snapshot('0.1.1', { InputColor: types('InputColor', '    format?: string;\n    alpha?: boolean;') }, { renamed: new Map([['InputColor', 'ColorInput']]) })
        ]);
        expect(out).toEqual({ InputColor: { status: 'changed', version: '0.1.1', props: { alpha: { status: 'new', version: '0.1.1' } } } });
    });

    it('forgets what is older than the last few releases, and keeps what is not cut yet', () => {
        const rounded = types('Button', '    label?: string;\n    rounded?: boolean;');
        const sized = types('Button', '    label?: string;\n    rounded?: boolean;\n    size?: string;');
        const steps = [snapshot('0.1.0', { Button: button }), snapshot('0.1.1', { Button: rounded }), snapshot('0.1.2', { Button: rounded }), snapshot('0.1.3', { Button: rounded })];
        expect(history(steps, 2)).toEqual({});
        expect(history(steps, 3)).toEqual({ Button: { status: 'changed', version: '0.1.1', props: { rounded: { status: 'new', version: '0.1.1' } } } });
        expect(history([...steps, snapshot('next', { Button: sized })], 2)).toEqual({
            Button: { status: 'changed', version: 'next', props: { size: { status: 'new', version: 'next' } } }
        });
    });

    it('tells the same history release by release, newest first', () => {
        const notes = releaseNotes([
            snapshot('0.1.0', { Button: button }, { date: '2026-01-01', summary: 'the first release' }),
            snapshot('0.1.1', { Button: types('Button', '    label?: string | number;\n    rounded?: boolean;'), Tag: types('Tag', '    value?: string;') }, { date: '2026-01-02' }),
            snapshot('0.1.2', { Button: types('Button', '    label?: string | number;'), Tag: types('Tag', '    value?: string;') }),
            snapshot('next', { Button: types('Button', '    label?: string | number;'), Tag: types('Tag', '    value?: string;') })
        ]);
        expect(notes).toEqual([
            // A member that went is a change to the component, though there is nothing left to mark.
            { version: '0.1.2', date: undefined, summary: undefined, components: [{ name: 'Button', status: 'changed' }] },
            {
                version: '0.1.1',
                date: '2026-01-02',
                summary: undefined,
                components: [
                    { name: 'Button', status: 'changed', props: { label: 'changed', rounded: 'new' } },
                    { name: 'Tag', status: 'new' }
                ]
            },
            { version: '0.1.0', date: '2026-01-01', summary: 'the first release', components: [] }
        ]);
    });
});
