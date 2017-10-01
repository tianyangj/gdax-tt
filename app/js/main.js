const data = window.data;

function normalizeData(items) {
  return items.map(item => {
    return {
      time: item.time,
      side: item.side,
      price: Number(item.price),
      size: Number(item.size),
      amount: Number(item.price) * Number(item.size)
    };
  });
}

function groupBySecond(items) {
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
}

function applyIQR(items, K, filter) {
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
    return {
      ...trade,
      side: side
    };
  });
  if (filter) {
    return result.filter(t => !!t.side);
  } else {
    return result;
  }
}

function applyZScore(items) {
  const netSizes = result.map(r => r.netSize);
  // console.log('netSizes', netSizes);
  const mean = ss.mean(netSizes);
  console.log('Mean', mean);
  const mode = ss.mode(netSizes);
  console.log('Mode', mode);
  const median = ss.median(netSizes);
  console.log('Median', median);
  const std = ss.standardDeviation(netSizes);
  console.log('Standard Deviation', std);
  return items.map(trade => {
    return {
      ...trade,
      zScore: ss.zScore(trade.netSize, mean, std)
    };
  });
}

function groupByMinute(items) {
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

let result = [];
result = normalizeData(data);
result = groupBySecond(result);
result = applyIQR(result, 1.5, true);
//result = applyZScore(result);
result = groupByMinute(result);
result = applyIQR(result, 1.5, true);

console.log('result', result);