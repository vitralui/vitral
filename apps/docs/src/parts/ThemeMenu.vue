<script setup lang="ts">
import { palette } from '@vitral/icons';
import { Button, Popover, Select, ToggleSwitch } from '@vitral/vue';
import { ref } from 'vue';
import { borders, direction, directionOptions, presetId, presetOptions, primary, setPrimary, swatches } from '../lib/theme';

// The bar at the top opens it downwards; the preview's bar at the foot, upwards.
withDefaults(defineProps<{ placement?: 'bottom-end' | 'top'; size?: 'small' }>(), { placement: 'bottom-end', size: undefined });

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
                Direction
                <Select v-model="direction" :options="directionOptions" option-label="label" option-value="value" size="small" aria-label="Reading direction" fluid />
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem">
                <span>
                    Strong borders
                    <small style="display: block; color: var(--vt-text-muted-color)">Edges at the ratio WCAG 1.4.11 asks for</small>
                </span>
                <ToggleSwitch
                    :model-value="borders === 'strong'"
                    aria-label="Strong borders"
                    @update:model-value="borders = $event ? 'strong' : 'soft'"
                />
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
        </div>
    </Popover>
</template>
