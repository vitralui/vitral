<script setup lang="ts">
import { palette } from '@vitral/icons';
import { Button, Icon, Popover, Select, useTheme, useVitral } from '@vitral/vue';
import { ref } from 'vue';
import { direction, directionOptions, presetId, presetOptions, primary, schemeOptions, setPrimary, swatches, variantOptions } from '../lib/theme';

// The bar at the top opens it downwards; the preview's bar at the foot, upwards.
withDefaults(defineProps<{ placement?: 'bottom-end' | 'top'; size?: 'small' }>(), { placement: 'bottom-end', size: undefined });

const theme = useTheme();
const { config } = useVitral();
const popover = ref<InstanceType<typeof Popover> | null>(null);
</script>

<template>
    <Button :icon="palette" variant="text" severity="secondary" :size="size" aria-label="Theme settings" @click="popover?.toggle($event)" />
    <Popover ref="popover" :placement="placement" aria-label="Theme settings">
        <div class="settings-grid" style="min-width: 15rem">
            <label>
                Preset
                <Select v-model="presetId" :options="presetOptions" option-label="label" option-value="value" size="small" aria-label="Preset" fluid />
            </label>
            <label>
                Colour scheme
                <Select v-model="theme.colorScheme.value" :options="schemeOptions" option-label="label" option-value="value" size="small" aria-label="Colour scheme" fluid />
            </label>
            <label>
                Fields
                <Select v-model="config.inputVariant" :options="variantOptions" option-label="label" option-value="value" size="small" aria-label="Field variant" fluid />
            </label>
            <label>
                Direction
                <Select v-model="direction" :options="directionOptions" option-label="label" option-value="value" size="small" aria-label="Reading direction" fluid />
            </label>
            <div>
                <div style="margin-bottom: 0.375rem; font-size: 0.8125rem; font-weight: 500">Primary</div>
                <div role="group" aria-label="Primary colour" style="display: flex; gap: 0.375rem">
                    <button
                        v-for="s in swatches"
                        :key="s.value"
                        class="swatch"
                        type="button"
                        :aria-label="s.name"
                        :aria-pressed="primary === s.value || (!primary && s.name === 'Blue') ? 'true' : 'false'"
                        :style="{ background: s.color }"
                        @click="setPrimary(s.value)"
                    />
                </div>
            </div>
            <p style="margin: 0; font-size: 0.75rem; line-height: 1.5; color: var(--vt-text-muted-color)">
                <Icon icon="info" style="vertical-align: -2px" /> Every choice here is one call on <code>useTheme()</code>, <code>useDirection()</code> or the configuration.
            </p>
        </div>
    </Popover>
</template>
