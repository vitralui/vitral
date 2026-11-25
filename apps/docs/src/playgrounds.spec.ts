import { describe, expect, it } from 'vitest';
import { apiOf, controlOf, loadApi } from './lib/api';
import { playgroundNames } from './lib/playgroundNames';
import { playgrounds } from './lib/playgrounds';

describe('playgrounds', () => {
    it('lists the same components as the page reads up front', () => {
        expect([...playgroundNames].sort()).toEqual(Object.keys(playgrounds).sort());
    });

    // A prop renamed or retyped in the library fails here rather than its control quietly going missing.
    it.each(Object.keys(playgrounds))('%s: every control names a prop it can set', async (file) => {
        await loadApi(file);
        const api = apiOf(file)!;
        for (const name of playgrounds[file]!.controls) {
            const member = api.props.find((prop) => prop.name === name);
            expect(member, `${file}.${name} is a prop`).toBeDefined();
            expect(controlOf(file, member!), `${file}.${name} has a control`).not.toBeNull();
        }
    });

    it('reads the choices behind a named type', async () => {
        await loadApi('Button');
        const severity = apiOf('Button')!.props.find((prop) => prop.name === 'severity')!;
        expect(controlOf('Button', severity)?.options).toContain('danger');
    });
});
