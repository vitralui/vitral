<script lang="ts">
import type { DemoMeta } from '../demo';
import { href } from '../lib/router';

export const meta: DemoMeta = {
    title: 'Chart',
    category: 'Data',
    description:
        'SVG charts with no dependency, over twenty types from one options object, with tooltips, legends, zoom and synced groups, readable from the keyboard.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Bands from './Chart/Bands.vue';
import BarsAndColumns from './Chart/BarsAndColumns.vue';
import Brush from './Chart/Brush.vue';
import Bullet from './Chart/Bullet.vue';
import CalendarChart from './Chart/CalendarChart.vue';
import CustomTooltip from './Chart/CustomTooltip.vue';
import Funnel from './Chart/Funnel.vue';
import HeatMap from './Chart/HeatMap.vue';
import HistogramAndBoxPlot from './Chart/HistogramAndBoxPlot.vue';
import HowItMoves from './Chart/HowItMoves.vue';
import LegendReadout from './Chart/LegendReadout.vue';
import Lines from './Chart/Lines.vue';
import Lollipop from './Chart/Lollipop.vue';
import NewNumbers from './Chart/NewNumbers.vue';
import OptionsAreData from './Chart/OptionsAreData.vue';
import PieAndDonut from './Chart/PieAndDonut.vue';
import Radar from './Chart/Radar.vue';
import RadialBarsAndGauge from './Chart/RadialBarsAndGauge.vue';
import RangeBarAndArea from './Chart/RangeBarAndArea.vue';
import ScatterAndBubbles from './Chart/ScatterAndBubbles.vue';
import SharedTooltip from './Chart/SharedTooltip.vue';
import Sparklines from './Chart/Sparklines.vue';
import StackedArea from './Chart/StackedArea.vue';
import Stream from './Chart/Stream.vue';
import SyncedTrading from './Chart/SyncedTrading.vue';
import TreeOfAnyDepth from './Chart/TreeOfAnyDepth.vue';
import TreemapAndSunburst from './Chart/TreemapAndSunburst.vue';
import Waterfall from './Chart/Waterfall.vue';
import WithoutFramework from './Chart/WithoutFramework.vue';
</script>

<template>
    <p class="demo-lead">
        Deciding which chart to use is a job for the eye, not for a list of names:
        <a :href="href('/charts')">every kind on one page</a>, live, with what each one is for and the options behind it.
    </p>

    <DemoSection title="Lines" description="Two y axes, each measuring its own series; a dashed second line with markers. Tab to the plot and use the arrow keys."><Lines /></DemoSection>
    <DemoSection title="Stacked area" description="Areas stack, with a gradient fill; axis labels use the compact preset and the tooltip its own template. Click a legend entry to hide a series."><StackedArea /></DemoSection>
    <DemoSection title="Bars and columns" description="The same data grouped, stacked (with totals), stacked to 100% and horizontal. Only the growing end of a bar is rounded."><BarsAndColumns /></DemoSection>
    <DemoSection title="Lollipop" description="Bars with most of the ink removed, for many categories with small differences."><Lollipop /></DemoSection>
    <DemoSection title="Scatter and bubbles" description="A numeric x axis, drag to zoom on both axes (on a touch screen, hold still and then drag), and a y annotation. Bubbles map their value to area, not radius."><ScatterAndBubbles /></DemoSection>
    <DemoSection title="Heat map" description="One colour in five steps: “more of the same colour” needs no legend."><HeatMap /></DemoSection>
    <DemoSection title="Waterfall" description="Bars that float: each one starts where the running total left off, so the chart shows how a number got from one total to another. `plotOptions.waterfall.totals` names the columns that return to zero."><Waterfall /></DemoSection>
    <DemoSection title="Range bar and range area" description="A point of `[low, high]` instead of one number: the bar spans the two, and the area fills between them. A line beside the band is a second series."><RangeBarAndArea /></DemoSection>
    <DemoSection title="Histogram and box plot" description="Two ways to show a spread. The histogram takes raw readings and bins them itself; the box plot takes the five numbers — minimum, quartiles, median, maximum — a category."><HistogramAndBoxPlot /></DemoSection>
    <DemoSection title="Funnel" description="Stages of a process, each as wide as its share of the first, so the fall reads as a slope. `{percent}` is in the label formatter because the share is what a funnel is read for."><Funnel /></DemoSection>
    <DemoSection title="Stream" description="A stacked area floating on a baseline of its own: the layers share the movement instead of the bottom one carrying it. `plotOptions.stream.offset` chooses how."><Stream /></DemoSection>
    <DemoSection title="Bullet" description="A measure, its target and the bands it falls in — a gauge’s job in a strip a table row can hold. The tick is the target the point carries."><Bullet /></DemoSection>
    <DemoSection title="Treemap and sunburst" description="Two ways to draw a hierarchy. The treemap packs it into boxes whose areas are the values; the sunburst rings it, a level a ring, so a wedge stays with its family."><TreemapAndSunburst /></DemoSection>
    <DemoSection title="A tree of any depth" description="A point that names a `parent` builds the tree itself, rather than the two levels a list of series gives."><TreeOfAnyDepth /></DemoSection>
    <DemoSection title="Radial bars and a gauge" description="Rings read against their own tracks, and one number against its maximum with the reading in the middle. `plotOptions.radialBar.min` and `max` set what a full ring means."><RadialBarsAndGauge /></DemoSection>
    <DemoSection title="Calendar" description="A year of days as a grid of weeks. A line of 365 points shows the trend; this shows the day."><CalendarChart /></DemoSection>
    <DemoSection title="Synced charts, trading" description="A price and its volume in one group: they share the crosshair, the tooltip and the zoom. Drag across either to zoom both; Shift-drag pans. Start the feed and the last candle becomes the one still being traded — its close moves on every tick, its high and low only ever widen — and the three session lines, read off that candle, move with it. Because the data is interpolated rather than replaced, a tick is a movement instead of a jump."><SyncedTrading /></DemoSection>
    <DemoSection title="Brush" description="The strip below is a brush: drag its window, or drag a new one, and the chart above follows, rescaling its y axis to what it shows."><Brush /></DemoSection>
    <DemoSection title="Pie and donut" description="The centre shows the total, or the slice in focus; a click (or Enter) pulls a slice out."><PieAndDonut /></DemoSection>
    <DemoSection title="Radar" description="A web of hairlines for comparing two profiles, and shaded bands for one."><Radar /></DemoSection>
    <DemoSection title="Sparklines" description="`chart.sparkline.enabled`: just the marks, for a stat tile."><Sparklines /></DemoSection>
    <DemoSection title="Options are data" description="Edit the JSON: every option here is plain data, which is what a visual editor will write. Narrow the window below 520px and the responsive entry turns the bars."><OptionsAreData /></DemoSection>
    <DemoSection title="Custom tooltip and no data" description="The tooltip slot replaces the readout; a chart with nothing to draw says so."><CustomTooltip /></DemoSection>
    <DemoSection title="New numbers arrive by moving" description="Press the button. The bars travel to their new heights instead of appearing at them, so it is visible which way each one went — the values are interpolated and the picture is redrawn each frame, which is why lines, areas and slices move too. `chart.animations.dynamicAnimation` sets the pace or turns it off, and a change that adds or removes a series simply draws, since there is nothing to move through."><NewNumbers /></DemoSection>
    <DemoSection title="How a chart moves" description="`chart.animations` sets the shape of the movement and whether the series arrive together or one behind the other. The same easing drives the first draw and every change after it, so a chart moves one way. None of it runs for a reader whose system asks for reduced motion."><HowItMoves /></DemoSection>
    <DemoSection title="The key as a readout" description="`legend.value` puts a figure beside each series name — its total, where it ended, its highest or lowest — so the question usually asked next to a legend is answered in it. This one shows the last reading of each line."><LegendReadout /></DemoSection>
    <DemoSection title="Bands behind the marks" description="Annotations with a `fillColor` shade a range rather than draw a line: two y bands naming what counts as quiet and busy, and an x band over the months a campaign ran. `position: 'back'` puts them under the data, where a background belongs."><Bands /></DemoSection>
    <DemoSection title="The whole column, or just what is under the pointer" description="On the left the tooltip is shared: it lists every series at the category, and picks out the one being pointed at so the panel answers both “how do these compare” and “what am I on”. On the right `tooltip.intersect` says one readout only, and it appears when the pointer is actually over a bar."><SharedTooltip /></DemoSection>
    <DemoSection title="Using the chart without a framework" description="The chart is @vitral/chart, which has no framework in it; &lt;Chart&gt; is a thin wrapper around it. createChart(element, { type, series, options }) draws into any element and returns a handle: update, on, zoomX, exportSvg, destroy. This one is mounted in a plain &lt;div&gt; by the module below."><WithoutFramework /></DemoSection>
</template>
