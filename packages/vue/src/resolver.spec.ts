import { describe, expect, it } from 'vitest';
import { VitralResolver, vitralAutoImports } from './resolver';

const componentResolver = (prefix?: string) => VitralResolver(prefix === undefined ? {} : { prefix })[0]!.resolve;

describe('the unplugin resolver', () => {
    it('resolves a component to its import and leaves other names alone', () => {
        const resolve = componentResolver();
        expect(resolve('Button')).toEqual({ name: 'Button', from: '@vitral/vue' });
        expect(resolve('FormRoot')).toEqual({ name: 'FormRoot', from: '@vitral/vue' });
        expect(resolve('MyOwnButton')).toBeUndefined();
        // `Form` is a plain object of parts, not a component.
        expect(resolve('Form')).toBeUndefined();
    });

    it('answers only under the configured prefix', () => {
        const resolve = componentResolver('Vt');
        expect(resolve('VtButton')).toEqual({ name: 'Button', from: '@vitral/vue' });
        expect(resolve('Button')).toBeUndefined();
        expect(resolve('VtWhatever')).toBeUndefined();
    });

    it('resolves directives, which arrive without the `v-`', () => {
        const [, directives] = VitralResolver();
        expect(directives?.type).toBe('directive');
        expect(directives?.resolve('Tooltip')).toEqual({ name: 'Tooltip', from: '@vitral/vue' });
        expect(directives?.resolve('Ripple')).toBeUndefined();
        expect(VitralResolver({ directives: false })).toHaveLength(1);
    });

    it('lists the composables for unplugin-auto-import', () => {
        const imports = vitralAutoImports()['@vitral/vue']!;
        expect(imports).toContain('useTheme');
        expect(imports).toContain('useToast');
        expect(imports).toContain('useVitral');
        // `<Form.Root>` needs the name in scope, so it is imported, not registered.
        expect(imports).toContain('Form');
    });
});
