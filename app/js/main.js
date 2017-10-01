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
  function getDateTimeId(time) {
    const datetime = new Date(time);
    const year = datetime.getUTCFullYear();
    const month = datetime.getUTCMonth() + 1;
    const date = datetime.getUTCDate();
    const hour = datetime.getUTCHours();
    const minute = datetime.getUTCMinutes();
    const second = datetime.getUTCSeconds();
    return `${year}-${month}-${date}T${hour}:${minute}:${second}Z`;
  }
  return items.reduce((groups, trade) => {
    const id = getDateTimeId(trade.time);
    let group = groups.find(g => g.id === id);
    if (group) {
      if (trade.side === 'buy') {
        group.buyTotal++;
        group.buySize += trade.size;
      } else if (trade.side === 'sell') {
        group.sellTotal++;
        group.sellSize += trade.size;
      }
      group.netSize = group.buySize - group.sellSize;
      group.endPrice = trade.price;
      group.trades.push(trade);
    } else {
      group = {
        id: id,
        message: '',
        startPrice: trade.price,
        endPrice: trade.price,
        netSize: 0,
        zScore: 0,
        buyTotal: 0,
        buySize: 0,
        sellTotal: 0,
        sellSize: 0,
        time: trade.time,
        trades: [trade]
      };
      if (trade.side === 'buy') {
        group.buyTotal++;
        group.buySize += trade.size;
      } else if (trade.side === 'sell') {
        group.sellTotal++;
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
    let message;
    if (trade.netSize < lower) {
      message = 'SELL';
    } else if (trade.netSize > upper) {
      message = 'BUY';
    }
    return {
      ...trade,
      message: message
    };
  });
  if (filter) {
    return result.filter(t => !!t.message);
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
  function getDateTimeId(time) {
    const datetime = new Date(time);
    const year = datetime.getUTCFullYear();
    const month = datetime.getUTCMonth() + 1;
    const date = datetime.getUTCDate();
    const hour = datetime.getUTCHours();
    const minute = datetime.getUTCMinutes();
    return `${year}-${month}-${date}T${hour}:${minute}Z`;
  }
  return items.reduce((accumulator, current) => {
    const id = getDateTimeId(current.time);
    let node = accumulator.find(t => t.id === id);
    if (node) {
      node.endPrice = current.endPrice;
      node.netSize += current.netSize;
      node.buyTotal += current.buyTotal;
      node.buySize += current.buySize;
      node.sellTotal += current.sellTotal;
      node.sellSize += current.sellSize;
      node.groups.push(current);
    } else {
      node = {
        id: id,
        message: '',
        startPrice: current.startPrice,
        endPrice: current.endPrice,
        netSize: current.netSize,
        buyTotal: current.buyTotal,
        buySize: current.buySize,
        sellTotal: current.sellTotal,
        sellSize: current.sellSize,
        time: current.time,
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