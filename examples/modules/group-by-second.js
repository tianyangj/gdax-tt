module.exports = function groupBySecond(items) {

    function getDateTime(time) {
        let datetime = new Date(time);
        datetime.setUTCMilliseconds(0);
        return datetime.toISOString();
    }

    return items.reduce((groups, trade) => {
        const time = getDateTime(trade.time);
        let group = groups.find(g => g.time === time);
        if (group) {
            if (trade.side === 'buy') {
                group.buyCount++;
                group.buySize += trade.size;
            } else if (trade.side === 'sell') {
                group.sellCount++;
                group.sellSize += trade.size;
            }
            group.netSize = group.buySize - group.sellSize;
            group.endPrice = trade.price;
            group.trades.push(trade);
        } else {
            group = {
                time: time,
                side: '',
                startPrice: trade.price,
                endPrice: trade.price,
                netSize: 0,
                buyCount: 0,
                buySize: 0,
                sellCount: 0,
                sellSize: 0,
                trades: [trade]
            };
            if (trade.side === 'buy') {
                group.buyCount++;
                group.buySize += trade.size;
            } else if (trade.side === 'sell') {
                group.sellCount++;
                group.sellSize += trade.size;
            }
            group.netSize = group.buySize - group.sellSize;
            groups.push(group);
        }
        return groups;
    }, []);
};