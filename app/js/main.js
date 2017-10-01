const data = window.data;
const QUEUE_SIZE = 10;
const K = 1.5;

let queue = [];

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

function applyIQR(items, filter) {
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

let result = [];
result = normalizeData(data);
result = groupBySecond(result);
result = applyIQR(result, true);
//result = applyZScore(result);

function getQueueSum(size) {
  if (queue.length >= QUEUE_SIZE) {
    queue.shift();
  }
  queue.push(size);
  return queue.reduce((acc, cur) => acc + cur, 0);
}

console.log('result', result);
//console.log('json', JSON.stringify(result));