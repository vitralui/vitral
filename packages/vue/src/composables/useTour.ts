import { createTour, type TourConfig, type TourHandle } from '@vitral/tour';
import { getCurrentInstance, onBeforeUnmount, watch } from 'vue';
import { appTourConfig as appConfig } from '../base/tour';
import { useVitral } from '../config/config';
import { useOverlayTarget } from './useOverlayTarget';

/**
 * A tour to drive from code: `useTour({ steps })`
 * returns `@vitral/tour`'s handle — `drive()`, `moveNext()`, `highlight()`,
 * `destroy()` — speaking the app's locale, wearing its theme, starting from
 * the plugin's `tour` defaults, and ended when the component that made it
 * goes away.
 */
export function useTour(options: TourConfig = {}): TourHandle {
    const context = useVitral();
    const overlayTarget = useOverlayTarget();
    const tour = createTour({ ...appConfig(context, () => overlayTarget.value), ...options });
    if (getCurrentInstance()) {
        // The app's settings follow it at runtime; what this tour was given stays on top.
        const stop = watch(
            () => [context.config.locale, context.config.unstyled, context.config.tour],
            () => tour.update({ ...appConfig(context, () => overlayTarget.value), ...options }),
            { deep: true }
        );
        onBeforeUnmount(() => {
            stop();
            tour.destroy();
        });
    }
    return tour;
}
