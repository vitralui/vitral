/**
 * A trend through a series: a straight line fitted by least squares, an
 * exponential curve (a straight line through the logarithms), or a moving
 * average. Each answers a value for every point it was given, in the same
 * order, so the trend draws over the series point for point.
 */

export type ChartTrendType = 'linear' | 'exponential' | 'movingAverage';

/** Least squares over the points that have a value: `y = intercept + slope·x`. Null with fewer than two. */
export function linearFit(xs: readonly number[], ys: readonly (number | null)[]): { slope: number; intercept: number } | null {
    let n = 0;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    xs.forEach((x, i) => {
        const y = ys[i];
        if (y === null || y === undefined || !Number.isFinite(y) || !Number.isFinite(x)) return;
        n++;
        sx += x;
        sy += y;
        sxx += x * x;
        sxy += x * y;
    });
    if (n < 2) return null;
    const denominator = n * sxx - sx * sx;
    if (denominator === 0) return null;
    const slope = (n * sxy - sx * sy) / denominator;
    return { slope, intercept: (sy - slope * sx) / n };
}

export function trendValues(xs: readonly number[], ys: readonly (number | null)[], type: ChartTrendType = 'linear', period = 3): (number | null)[] {
    if (type === 'movingAverage') {
        const size = Math.max(1, Math.floor(period));
        return ys.map((_, i) => {
            if (i + 1 < size) return null;
            const window = ys.slice(i + 1 - size, i + 1);
            if (window.some((y) => y === null || y === undefined)) return null;
            return (window as number[]).reduce((a, b) => a + b, 0) / size;
        });
    }
    if (type === 'exponential') {
        // Only positive values have a logarithm; an exponential trend through anything else has no meaning.
        const logs = ys.map((y) => (y !== null && y > 0 ? Math.log(y) : null));
        const fit = linearFit(xs, logs);
        return fit ? xs.map((x) => Math.exp(fit.intercept + fit.slope * x)) : ys.map(() => null);
    }
    const fit = linearFit(xs, ys);
    return fit ? xs.map((x) => fit.intercept + fit.slope * x) : ys.map(() => null);
}
