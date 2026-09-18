import { buildCartesian, buildHeatmap } from './cartesian';
import { buildFunnel } from './funnel';
import { buildPie, buildRadar } from './polar';
import type { ChartScene, SceneInput } from './scene';
import { histogramBins } from './spans';

/**
 * A histogram is given readings, not columns: it counts how many fall in each
 * bin and draws that. The binning happens here, before the layout, so what
 * reaches it is an ordinary bar chart of counts with the bins as its
 * categories — and everything downstream, the tooltip and the keyboard summary
 * included, needs to know nothing about histograms.
 */
function binned(input: SceneInput): SceneInput {
    const readings = input.series.flatMap((s) => s.points.map((p) => p.y).filter((y): y is number => y !== null));
    const bins = histogramBins(readings, input.options.plotOptions?.histogram?.bins);
    if (!bins.length) return input;
    const round = (n: number) => (Number.isInteger(n) ? n : Number(n.toFixed(2)));
    return {
        ...input,
        series: [
            {
                index: 0,
                name: input.series[0]?.name ?? '',
                hidden: false,
                points: bins.map((b, index) => ({ index, x: `${round(b.from)}–${round(b.to)}`, y: b.count }))
            }
        ],
        options: { ...input.options, xaxis: { ...input.options.xaxis, categories: bins.map((b) => `${round(b.from)}–${round(b.to)}`) } }
    };
}

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
        case 'histogram':
            return buildCartesian(binned(sized));
        case 'funnel':
            return buildFunnel(sized);
        default:
            return buildCartesian(sized);
    }
}
