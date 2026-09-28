import type { TourConfig } from '@vitral/tour';
import { toRaw } from 'vue';
import type { VitralContext } from '../config/config';

/** The Vitral side of a tour: the app's words, look and layer, under the app's tour defaults. */
export function appTourConfig(context: VitralContext, overlayTarget: () => string | HTMLElement | undefined): TourConfig {
    const { config } = context;
    return {
        ...toRaw(config.tour),
        locale: config.locale,
        unstyled: config.unstyled,
        nonce: config.csp.nonce,
        cssLayer: config.cssLayer,
        overlayTarget,
        zIndex: config.zIndex.modal
    };
}
