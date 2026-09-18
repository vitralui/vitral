import { addComponent, addImports, addPlugin, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit';
import { componentNames, composableNames, directiveNames } from '@vitral/vue/manifest';
import { componentRegistrations, defaults, extraComposables, optionsTemplate, type VitralModuleOptions } from './options.js';

/**
 * Vitral in a Nuxt app: the plugin configured from `nuxt.config`, components
 * and composables auto-imported, theme and stylesheets rendered on the server,
 * and the colour scheme kept in a cookie so the server renders the one the
 * reader picked.
 *
 * ```ts
 * export default defineNuxtConfig({
 *     modules: ['@vitral/nuxt'],
 *     vitral: { preset: 'Prism', colorScheme: 'system' }
 * });
 * ```
 */
export default defineNuxtModule<VitralModuleOptions>({
    meta: {
        name: '@vitral/nuxt',
        configKey: 'vitral',
        compatibility: { nuxt: '>=4.0.0' }
    },
    defaults,
    setup(options, nuxt) {
        const resolver = createResolver(import.meta.url);

        // The preset and locale are objects and `nuxt.config` carries data, so
        // the plugin reads them from a generated module instead.
        addTemplate({
            filename: 'vitral-options.mjs',
            write: true,
            getContents: () => optionsTemplate(options, options.components ? directiveNames : [])
        });
        addPlugin(resolver.resolve('./runtime/plugin'));

        if (options.components) {
            for (const component of componentRegistrations(componentNames, options.prefix)) addComponent(component);
            // `Form` is a frozen object of parts rather than a component, since
            // `<form>` is already an element. Import it by name so `<Form.Root>`
            // works.
            addImports({ name: 'Form', as: `${options.prefix}Form`, from: '@vitral/vue' });
            // Directives come with them, registered by the plugin (see the note
            // in `optionsTemplate`). They keep their plain names: `v-tooltip`.
        }

        if (options.composables) {
            addImports([...composableNames, ...extraComposables].map((name) => ({ name, from: '@vitral/vue' })));
        }
    }
});

declare module '@nuxt/schema' {
    interface NuxtConfig {
        vitral?: Partial<VitralModuleOptions>;
    }
    interface NuxtOptions {
        vitral?: VitralModuleOptions;
    }
}

export type { VitralModuleOptions };
