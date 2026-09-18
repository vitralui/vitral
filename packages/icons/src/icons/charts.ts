// Charts & data: graphs, tables and the shapes of numbers.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'charts';

export const barChart: IconDef = { name: 'barChart', category, tags: ['graph', 'statistics', 'columns'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M8 17v-5M12 17V7M16 17v-8M20 17v-3"/>' };
export const barChartHorizontal: IconDef = { name: 'barChartHorizontal', category, tags: ['graph', 'statistics', 'rows'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 7h6M7 11h11M7 15h8"/>' };
export const lineChart: IconDef = { name: 'lineChart', category, tags: ['graph', 'trend', 'statistics'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 15l4-5 3 3 6-7"/>' };
export const areaChart: IconDef = { name: 'areaChart', category, tags: ['graph', 'filled', 'statistics'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 17v-4l4-5 3 3 5-5v11z"/>' };
export const pieChart: IconDef = { name: 'pieChart', category, tags: ['graph', 'share', 'proportion'], body: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 2.5A7 7 0 0 1 21.5 9H15z"/>' };
export const donutChart: IconDef = { name: 'donutChart', category, tags: ['graph', 'ring', 'proportion'], body: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v5M16 14l4.3 2.5"/>' };
export const scatterChart: IconDef = { name: 'scatterChart', category, tags: ['plot', 'points', 'correlation'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><circle cx="8" cy="15" r="1"/><circle cx="11" cy="10" r="1"/><circle cx="15" cy="13" r="1"/><circle cx="17" cy="6" r="1"/><circle cx="19" cy="10" r="1"/>' };
export const candlestickChart: IconDef = { name: 'candlestickChart', category, tags: ['stocks', 'trading', 'ohlc'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M8 5v3M8 15v2M16 7v2M16 16v2"/><rect x="6" y="8" width="4" height="7" rx="1"/><rect x="14" y="9" width="4" height="7" rx="1"/>' };
export const gauge: IconDef = { name: 'gauge', category, tags: ['speedometer', 'meter', 'performance'], body: '<path d="M12 14l4-5M3.5 18a10 10 0 1 1 17 0"/><circle cx="12" cy="14" r="1"/>' };
export const activity: IconDef = { name: 'activity', category, tags: ['pulse', 'heartbeat', 'monitoring'], body: '<path d="M2 12h4l3-8 6 16 3-8h4"/>' };
export const trendingUp: IconDef = { name: 'trendingUp', category, tags: ['growth', 'increase', 'profit'], body: '<path d="M2 17l7-7 4 4 9-9M15 5h7v7"/>' };
export const trendingDown: IconDef = { name: 'trendingDown', category, tags: ['decline', 'decrease', 'loss'], body: '<path d="M2 7l7 7 4-4 9 9M15 19h7v-7"/>' };
export const table: IconDef = { name: 'table', category, tags: ['grid', 'spreadsheet', 'data'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M12 3v18"/>' };
export const kanban: IconDef = { name: 'kanban', category, tags: ['board', 'columns', 'tasks'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>' };
export const chartColumnStacked: IconDef = { name: 'chartColumnStacked', category, tags: ['stacked bars', 'graph'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M8 17v-4M8 10V8M12 17v-2M12 12V5M16 17v-5M16 9V7"/>' };
export const funnel: IconDef = { name: 'funnel', category, tags: ['conversion', 'pipeline', 'sales'], body: '<path d="M3 4h18M5.5 9h13M8 14h8M10.5 19h3"/>' };
export const sigma: IconDef = { name: 'sigma', category, tags: ['sum', 'total', 'math'], body: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>' };
export const percentSquare: IconDef = { name: 'percentSquare', category, tags: ['ratio', 'percentage'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 16l8-8M9 9h.01M15 15h.01"/>' };
export const chartGantt: IconDef = { name: 'chartGantt', category, tags: ['timeline', 'schedule', 'project'], body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 6h6M10 10h7M9 14h5M14 17.5h5"/>' };
export const radar: IconDef = { name: 'radar', category, tags: ['scan', 'detection', 'chart'], body: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><path d="M12 12l6-6"/><circle cx="12" cy="12" r="2"/>' };
