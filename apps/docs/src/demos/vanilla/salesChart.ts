// No framework here: `@vitral/chart` draws into any element, and the same
// options object the <Chart> component takes configures it.
import { createChart, type ChartHandle, type ChartType } from '@vitral/chart';

export function mountSalesChart(element: HTMLElement, onPick: (text: string) => void): ChartHandle {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const chart = createChart(element, {
        type: 'bar',
        series: [
            { name: 'Online', data: [42, 58, 51, 73] },
            { name: 'Stores', data: [35, 31, 38, 36] }
        ],
        options: {
            chart: { height: 260, toolbar: { show: false } },
            xaxis: { categories: quarters },
            yaxis: { labels: { formatter: '{value}k' } },
            plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
            legend: { position: 'top', horizontalAlign: 'right' }
        }
    });
    chart.on('dataPointSelection', ({ seriesIndex, dataPointIndex, value, selected }) => {
        const series = seriesIndex === 0 ? 'Online' : 'Stores';
        onPick(selected ? `${series}, ${quarters[dataPointIndex]}: ${value}k` : 'Nothing selected');
    });
    return chart;
}

// Later: new inputs are compared by value, and only what changed is redrawn.
export const switchType = (chart: ChartHandle, type: ChartType) => chart.update({ type });

// And when the element goes away: chart.destroy();
