import { componentNames, composableNames, directiveNames } from './components/manifest';

// Auto-imports outside Nuxt. A plain Vite app gets them from
// unplugin-vue-components (components and directives) and unplugin-auto-import
// (composables). Both take a list, and the list is the same manifest the Nuxt
// module registers from.
//
// ```ts
// import Components from 'unplugin-vue-components/vite';
// import AutoImport from 'unplugin-auto-import/vite';
// import { VitralResolver, vitralAutoImports } from '@vitral/vue/resolver';
//
// export default defineConfig({
//     plugins: [vue(), Components({ resolvers: [VitralResolver()] }), AutoImport({ imports: [vitralAutoImports()] })]
// });
// ```

/** The shape unplugin-vue-components expects, declared here so it is not a dependency. */
export interface ComponentResolveResult {
    name: string;
    from: string;
}

export interface ComponentResolver {
    type: 'component' | 'directive';
    resolve: (name: string) => ComponentResolveResult | undefined;
}

export interface VitralResolverOptions {
    /** The prefix templates are written with: `'Vt'` resolves `<VtButton>`. Empty by default, so `<Button>`. */
    prefix?: string;
    /** Resolve `v-tooltip` as well. On by default. */
    directives?: boolean;
}

const from = '@vitral/vue';

/**
 * Resolves every Vitral component, and `v-tooltip`, to its import, so templates
 * need no import lines. Pass it to unplugin-vue-components:
 * `Components({ resolvers: [VitralResolver()] })`.
 */
export function VitralResolver(options: VitralResolverOptions = {}): ComponentResolver[] {
    const prefix = options.prefix ?? '';
    const components = new Set<string>(componentNames);
    const directives = new Set<string>(directiveNames);

    /** The export behind the name a template used, or null if the prefix says it is not ours. */
    const exportOf = (name: string): string | null => (!prefix ? name : name.startsWith(prefix) ? name.slice(prefix.length) : null);

    const resolvers: ComponentResolver[] = [
        {
            type: 'component',
            resolve(name) {
                const exported = exportOf(name);
                return exported && components.has(exported) ? { name: exported, from } : undefined;
            }
        }
    ];

    if (options.directives !== false) {
        resolvers.push({
            type: 'directive',
            // The name arrives without the `v-`, so `v-tooltip` asks for `Tooltip`.
            resolve: (name) => (directives.has(name) ? { name, from } : undefined)
        });
    }

    return resolvers;
}

/**
 * The composables and `Form`, for unplugin-auto-import:
 * `AutoImport({ imports: [vitralAutoImports()] })`.
 */
export function vitralAutoImports(): Record<string, string[]> {
    return { [from]: [...composableNames, 'useVitral', 'Form'] };
}
