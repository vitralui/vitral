import { formatMessage, type Locale } from '@vitral/core';
import { computed } from 'vue';
import { useVitral } from '../config/config';

/** The active locale, and a way to switch it for every component at once. */
export function useLocale() {
    const { config } = useVitral();
    return {
        locale: computed(() => config.locale),
        setLocale: (locale: Locale) => {
            config.locale = locale;
        },
        format: formatMessage
    };
}
