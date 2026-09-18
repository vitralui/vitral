import type { App, Plugin } from 'vue';
import { createVitralContext, VitralKey, type VitralContext, type VitralOptions } from './config/config';

/**
 * `app.use(Vitral, options)`: provides the configuration, mounts the theme and
 * sets up the toast and confirm channels, so `useToast()` and `useConfirm()`
 * work anywhere below without a separate service to install.
 */
export const Vitral: Plugin<[VitralOptions?]> = {
    install(app: App, options: VitralOptions = {}) {
        const context = createVitralContext(options);
        app.provide(VitralKey, context);
        app.config.globalProperties.$vitral = context;
        context.theme?.mount();
    }
};

declare module 'vue' {
    interface ComponentCustomProperties {
        $vitral: VitralContext;
    }
}
