<script setup lang="ts">
import { encodeQR, qrPath } from '@vitral/core';
import { qrcodeStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { QRCodeProps } from './types';

defineOptions({ name: 'VtQRCode' });

const props = withDefaults(defineProps<QRCodeProps>(), { unstyled: undefined, margin: 4, imageSize: 0.22 });

const { part } = useComponent(qrcodeStyle, props);

// A logo covers part of the code, so the code is made to survive losing it.
const code = computed(() => {
    try {
        return encodeQR(props.value, { ecc: props.ecc ?? (props.image ? 'H' : 'M') });
    } catch {
        return null;
    }
});
const extent = computed(() => (code.value ? code.value.size + props.margin * 2 : 0));
const path = computed(() => (code.value ? qrPath(code.value, props.margin) : ''));
const style = computed(() => ({
    ...(props.size ? { width: props.size } : {}),
    ...(props.background ? { background: props.background } : {})
}));
</script>

<template>
    <div v-bind="part('root')" :style="style" role="img" :aria-label="label ?? value">
        <svg v-if="code" :viewBox="`0 0 ${extent} ${extent}`" shape-rendering="crispEdges" aria-hidden="true" v-bind="part('svg')">
            <path :d="path" v-bind="part('modules')" :style="color ? { fill: color } : undefined" />
        </svg>
        <img v-if="code && image" :src="image" alt="" v-bind="part('image')" :style="{ width: `${imageSize * 100}%`, height: `${imageSize * 100}%` }" />
    </div>
</template>
