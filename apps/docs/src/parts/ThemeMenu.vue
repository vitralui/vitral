<script setup lang="ts">
import { t } from '../lib/i18n';
import { palette } from '@vitral/icons';
import { Button, Popover, Select, ToggleSwitch } from '@vitral/vue';
import { ref, watch } from 'vue';
import { borders, direction, directionOptions, presetId, presetOptions, primary, setPrimary, swatches } from '../lib/theme';

// The bar at the top opens it downwards; the preview's bar at the foot, upwards.
withDefaults(defineProps<{ placement?: 'bottom-end' | 'top'; size?: 'small' }>(), { placement: 'bottom-end', size: undefined });

const popover = ref<InstanceType<typeof Popover> | null>(null);

// A new direction turns the page over under the menu, which was placed, and
// took its direction, for the page as it was: it closes rather than hanging
// on the wrong side reading the wrong way.
watch(direction, () => popover.value?.hide());
</script>

<template>
    <Button :icon="palette" variant="text" severity="secondary" :size="size" :aria-label="t('Theme settings')" @click="popover?.toggle($event)" />
    <Popover ref="popover" :placement="placement" :aria-label="t('Theme settings')">
        <div class="settings-grid" style="min-width: 15rem">
            <label>
                {{ t('Preset') }}
                <Select v-model="presetId" :options="presetOptions" option-label="label" option-value="value" size="small" :aria-label="t('Preset')" fluid />
            </label>
            <label>
                {{ t('Direction') }}
                <Select v-model="direction" :options="directionOptions.map((option) => ({ ...option, label: t(option.label) }))" option-label="label" option-value="value" size="small" :aria-label="t('Reading direction')" fluid />
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem">
                <span>
                    {{ t('Strong borders') }}
                    <small style="display: block; color: var(--vt-text-muted-color)">{{ t('Edges at the ratio WCAG 1.4.11 asks for') }}</small>
                </span>
                <ToggleSwitch
                    :model-value="borders === 'strong'"
                    :aria-label="t('Strong borders')"
                    @update:model-value="borders = $event ? 'strong' : 'soft'"
                />
            </label>
            <div>
                <div style="margin-bottom: 0.375rem; font-size: 0.8125rem; font-weight: 500">{{ t('Primary') }}</div>
                <div role="group" :aria-label="t('Primary colour')" style="display: flex; gap: 0.375rem">
                    <button
                        v-for="s in swatches"
                        :key="s.value"
                        class="swatch"
                        type="button"
                        :aria-label="t(s.name)"
                        :aria-pressed="primary === s.value || (!primary && s.name === 'Blue') ? 'true' : 'false'"
                        :style="{ background: s.color }"
                        @click="setPrimary(s.value)"
                    />
                </div>
            </div>
        </div>
    </Popover>
</template>
