const data = window.data;
const TOKEN_SIZE = 10;
const QUEUE_SIZE = 10;

let total = 0;
let queue = [];
const result = data
  .map(normalizeData)
  .reduce(groupBySecond, [])
  .map(trade => {
    return {
      ...trade,
      //warning: Math.abs(trade.netSize) >= TOKEN_SIZE ? true : undefined,
    };
  });

function normalizeData(trade) {
  return {
    time: trade.time,
    side: trade.side,
    price: Number(trade.price),
    size: Number(trade.size),
    amount: Number(trade.price) * Number(trade.size)
  };
}

function groupBySecond(groups, trade) {
  const tradeTime = new Date(trade.time);
  let group = groups.find(g => g.id === getDateTimeId(trade.time));
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
      id: getDateTimeId(trade.time),
      warning: undefined,
      zScore: 0,
      netSize: 0,
      startPrice: trade.price,
      endPrice: trade.price,
      buyTotal: 0,
      buySize: 0,
      sellTotal: 0,
      sellSize: 0,
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
}

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

const netSizes = result.map(r => r.netSize);
// console.log('netSizes', netSizes);
const q1 = ss.quantile(netSizes, 0.25);
console.log('Q1', q1);
const q3 = ss.quantile(netSizes, 0.75);
console.log('Q3', q3);
const iqr = ss.interquartileRange(netSizes);
console.log('IQR', iqr);
const mean = ss.mean(netSizes);
console.log('mean', mean);
const mode = ss.mode(netSizes);
console.log('mode', mode);
const median = ss.median(netSizes);
console.log('median', median);
const std = ss.standardDeviation(netSizes);
console.log('Standard Deviation', std);

const K1 = 1.5;
const K2 = 3;
let lower2 = q1 - K2 * iqr;
let lower1 = q1 - K1 * iqr;
let upper1 = q3 + K1 * iqr;
let upper2 = q3 + K2 * iqr;
console.log('Tukey Fences', lower2, lower1, upper1, upper2);

result.forEach(trade => {
  trade.zScore = ss.zScore(trade.netSize, mean, std);
  if (trade.netSize < lower2) {
    trade.warning = 'SELL SELL';
  } else if (trade.netSize >= lower2 && trade.netSize <= lower1) {
    trade.warning = 'SELL';
  } else if (trade.netSize >= upper1 && trade.netSize <= upper2) {
    trade.warning = 'BUY';
  } else if (trade.netSize > upper2) {
    trade.warning = 'BUY BUY';
  }
});

function getQueueSum(size) {
  if (queue.length >= QUEUE_SIZE) {
    queue.shift();
  }
  queue.push(size);
  return queue.reduce((acc, cur) => acc + cur, 0);
}

console.log('total', total);
console.log('result', result);
//console.log('json', JSON.stringify(result));