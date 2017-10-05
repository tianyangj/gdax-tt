module.exports = function groupByMinute(items) {
    function getDateTime(time) {
        let datetime = new Date(time);
        datetime.setUTCSeconds(0);
        datetime.setUTCMilliseconds(0);
        return datetime.toISOString();
    }
    return items.reduce((accumulator, current) => {
        const time = getDateTime(current.time);
        let node = accumulator.find(t => t.time === time);
        if (node) {
            node.endPrice = current.endPrice;
            node.netSize += current.netSize;
            node.buyCount += current.buyCount;
            node.buySize += current.buySize;
            node.sellCount += current.sellCount;
            node.sellSize += current.sellSize;
            node.groups.push(current);
        } else {
            node = {
                time: time,
                side: '',
                startPrice: current.startPrice,
                endPrice: current.endPrice,
                netSize: current.netSize,
                buyCount: current.buyCount,
                buySize: current.buySize,
                sellCount: current.sellCount,
                sellSize: current.sellSize,
                groups: [current]
            };
            accumulator.push(node);
        }
        return accumulator;
    }, []);
}