import { directionOf as measure, isClient, type Direction } from '@vitral/core';
import { computed, type ComputedRef } from 'vue';
import { useVitral } from '../config/config';

export interface UseDirection {
    /** The configured direction: what the library assumes where it cannot measure the page. */
    direction: ComputedRef<Direction>;
    isRtl: ComputedRef<boolean>;
    /** Switches every component that has nothing to measure, the same way `setLocale` switches the words. */
    setDirection: (direction: Direction) => void;
    /**
     * The direction an element is really laid out in — a `dir` anywhere above it
     * decides, not the configuration — falling back to the configured one when
     * there is no element, or no browser to ask.
     */
    directionOf: (el?: Element | null) => Direction;
}

/**
 * The reading direction. Layout and mirroring are CSS: set `dir` on the element
 * you mount the application in and the styles, which are written in logical
 * properties, turn round with it. This is for the two places CSS cannot reach —
 * a popup teleported out of the application, and the server — and for code that
 * has to branch on the direction itself.
 */
export function useDirection(): UseDirection {
    const { config } = useVitral();
    return {
        direction: computed(() => config.direction),
        isRtl: computed(() => config.direction === 'rtl'),
        setDirection: (direction: Direction) => {
            config.direction = direction;
        },
        directionOf: (el?: Element | null) => (el && isClient ? measure(el) : config.direction)
    };
}
