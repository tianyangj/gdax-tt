const data = window.data;
const WARNING = 10000;

let total = 0;
let time = new Date(data[0].time).getTime();
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
    amount: amount,
    x: (new Date(trade.time).getTime() - time) / 1000,
    y: total
  };
}).reduce((acc, cur) => {
  let currentTime = new Date(cur.time);
  let currentYear = currentTime.getUTCFullYear();
  let currentMonth = currentTime.getUTCMonth() + 1;
  let currentDate = currentTime.getUTCDate();
  let currentHour = currentTime.getUTCHours();
  let currentMinute = currentTime.getUTCMinutes();
  let node = acc.find(x => x.id === getDateTimeId(currentYear, currentMonth, currentDate, currentHour, currentMinute));
  if (node) {
    if (cur.side === 'buy') {
      node.buy++;
      node.buyVolume += cur.amount;
    } else if (cur.side === 'sell') {
      node.sell++;
      node.sellVolume += cur.amount;
    }
    if (Math.abs(node.netVolume) > WARNING) {
      node.warning = true;
    }
    node.endPrice = cur.price;
    node.netVolume = node.buyVolume - node.sellVolume;
    node.trades.push(cur);
  } else {
    let node = {
      id: getDateTimeId(currentYear, currentMonth, currentDate, currentHour, currentMinute),
      warning: undefined,
      netVolume: 0,
      startPrice: cur.price,
      endPrice: cur.price,
      buy: 0,
      buyVolume: 0,
      sell: 0,
      sellVolume: 0,
      trades: [cur]
    };
    if (cur.side === 'buy') {
      node.buy = 1;
      node.buyVolume = cur.amount;
    } else if (cur.side === 'sell') {
      node.sell = 1;
      node.sellVolume = cur.amount;
    }
    node.netVolume = node.buyVolume - node.sellVolume;
    acc.push(node);
  }
  return acc;
}, []);

function getDateTimeId(year, month, date, hour, minute) {
  return `${year}-${month}-${date}T${hour}:${minute}Z`;
}

// let queue = [];
// function getLastNSum(trade, n) {
//   n = n | 100;
//   let price = trade.side === 'sell' ? -Math.abs(Number(trade.price)) : Number(trade.price);
//   let size = Number(trade.size);
//   if (queue.length >= n) {
//     queue.shift();
//   }
//   queue.push(price * size);
//   return queue.reduce((acc, cur) => acc + cur, 0);
// }

console.log('total', total);
console.log('result', result);
//console.log('json', JSON.stringify(result));