import { buildCartesian, buildHeatmap } from './cartesian';
import { buildPie, buildRadar } from './polar';
import type { ChartScene, SceneInput } from './scene';

/** Lays a chart out: everything a renderer draws, and everything the pointer and keyboard read. */
export function buildChartScene(input: SceneInput): ChartScene {
    const width = Math.max(0, input.width);
    const height = Math.max(0, input.height);
    const sized = { ...input, width, height };
    switch (input.type) {
        case 'pie':
        case 'donut':
            return buildPie(sized);
        case 'radar':
            return buildRadar(sized);
        case 'heatmap':
            return buildHeatmap(sized);
        default:
            return buildCartesian(sized);
    }
}
