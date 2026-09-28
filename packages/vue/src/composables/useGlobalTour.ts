import { createTour, type TourConfig, type TourHandle } from '@vitral/tour';
import { effectScope, watch } from 'vue';
import { appTourConfig as appConfig } from '../base/tour';
import { useVitral } from '../config/config';

/**
 * The application's one tour, the same handle from anywhere below the plugin.
 * It belongs to the app rather than to a component, so a tour started on one
 * page carries on across route changes — the onboarding that walks through
 * several screens — and it ends only when told to or when the app unmounts.
 * `options` given here are merged into it: `useGlobalTour({ steps })`.
 */
export function useGlobalTour(options?: TourConfig): TourHandle {
    const context = useVitral();
    if (!context.globalTour) {
        const tour = createTour(appConfig(context, () => undefined));
        effectScope(true).run(() =>
            watch(
                () => [context.config.locale, context.config.unstyled, context.config.tour],
                () => tour.update({ ...appConfig(context, () => undefined), steps: tour.getConfig().steps }),
                { deep: true }
            )
        );
        // `destroy()` ends a run of it, not the tour: it is there to drive again. The app's unmount ends it for good.
        context.globalTour = tour;
    }
    if (options) context.globalTour.update(options);
    return context.globalTour;
}
