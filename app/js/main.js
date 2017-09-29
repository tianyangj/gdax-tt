const data = window.data;
const TOKEN_SIZE = 10;
const QUEUE_SIZE = 10;

let total = 0;
let time = new Date(data[0].time).getTime();
let queue = [];
const result = data.map(trade => {
  const {
    type,
    productId,
    tradeId,
    sourceSequence,
    ...subset
  } = trade;
  const amount = Number(trade.price) * Number(trade.size);
  if (trade.side === 'buy') {
    total += amount;
  } else if (trade.side === 'sell') {
    total -= amount;
  }
  return {
    ...subset,
    price: Number(trade.price),
    size: Number(trade.size),
    amount: amount,
    x: (new Date(trade.time).getTime() - time) / 1000,
    y: total
  };
}).reduce((acc, cur) => {
  let currentTime = new Date(cur.time);
  let node = acc.find(x => x.id === getDateTimeId(currentTime));
  if (node) {
    if (cur.side === 'buy') {
      node.buy++;
      node.buySize += cur.size;
    } else if (cur.side === 'sell') {
      node.sell++;
      node.sellSize += cur.size;
    }
    node.endPrice = cur.price;
    node.netSize = node.buySize - node.sellSize;
    node.trades.push(cur);
  } else {
    let node = {
      id: getDateTimeId(currentTime),
      warning: undefined,
      weight: 0,
      netSize: 0,
      startPrice: cur.price,
      endPrice: cur.price,
      buy: 0,
      buySize: 0,
      sell: 0,
      sellSize: 0,
      trades: [cur]
    };
    if (cur.side === 'buy') {
      node.buy = 1;
      node.buySize = cur.size;
    } else if (cur.side === 'sell') {
      node.sell = 1;
      node.sellSize = cur.size;
    }
    node.netSize = node.buySize - node.sellSize;
    acc.push(node);
  }
  return acc;
}, []).map(trade => {
  return {
    ...trade,
    warning: Math.abs(trade.netSize) >= TOKEN_SIZE ? true : undefined,
    weight: getQueueSum(trade.netSize)
  };
});

function getDateTimeId(datetime) {
  let year = datetime.getUTCFullYear();
  let month = datetime.getUTCMonth() + 1;
  let date = datetime.getUTCDate();
  let hour = datetime.getUTCHours();
  let minute = datetime.getUTCMinutes();
  let second = datetime.getUTCSeconds();
  return `${year}-${month}-${date}T${hour}:${minute}:${second}Z`;
}

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