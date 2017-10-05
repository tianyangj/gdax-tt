const ss = require('simple-statistics');

module.exports = function applyIQR(items, K, filter) {
    K = K || 1.5;
    filter = filter || true;
    const netSizes = items.map(item => item.netSize);
    // console.log('netSizes', netSizes);
    const q1 = ss.quantile(netSizes, 0.25);
    console.log('Q1', q1);
    const q3 = ss.quantile(netSizes, 0.75);
    console.log('Q3', q3);
    const iqr = ss.interquartileRange(netSizes);
    console.log('IQR', iqr);
    const lower = q1 - K * iqr;
    const upper = q3 + K * iqr;
    console.log(`Tukey Fences [${lower}, ${upper}]`);
    let result = items.map(trade => {
        let side;
        if (trade.netSize < lower) {
            side = 'sell';
        } else if (trade.netSize > upper) {
            side = 'buy';
        }
        return Object.assign(trade, {
            side: side
        });
    });
    if (filter) {
        return result.filter(t => !!t.side);
    } else {
        return result;
    }
}