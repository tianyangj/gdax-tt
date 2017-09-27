import * as GTT from '../src';
import { GDAXFeed } from "../src/exchanges";
import { OrderbookMessage } from "../src/core";

const jsonfile = require('jsonfile');
const logger = GTT.utils.ConsoleLoggerFactory();
const products: string[] = ['ETH-USD'];
const tallies: any = {};
products.forEach((product: string) => {
    tallies[product] = {};
});

let count = 0;

GTT.Factories.GDAX.FeedFactory(logger, products).then((feed: GDAXFeed) => {
    feed.on('data', (msg: OrderbookMessage) => {
        count++;
        if (!(msg as any).productId) {
            tallies.other += 1;
        } else {
            const tally = tallies[msg.productId];
            if (!tally[msg.type]) {
                tally[msg.type] = 0;
            }
            tally[msg.type] += 1;
        }
        if (count % 1000 === 0) {
            printTallies();
        }
        // if (msg.type === 'snapshot') {
        //     writeSnapshot(msg);
        // }
        // if (msg.type === 'trade') {
        //     writeTrades(msg);
        // }
        // if (msg.type === 'ticker') {
        //     writeTickers(msg);
        // }
        // if (msg.type === 'level') {
        //     writeUpdates(msg);
        // }
    });
}).catch((err: Error) => {
    logger.log('error', err.message);
    process.exit(1);
});

function printTallies() {
    console.log(`${count} messages received`);
    for (const p in tallies) {
        const types = Object.keys(tallies[p]).sort();
        const tally: string = types.map((t) => `${t}: ${tallies[p][t]}`).join('\t');
        console.log(`${p}: ${tally}`);
    }
}

function writeSnapshot(obj: any) {
    jsonfile.writeFile('./snapshot.json', obj, { spaces: 2 }, (err: any) => {
        console.error(err)
    });
}

function writeTrades(obj: any) {
    jsonfile.writeFile('./trades.json', obj, { spaces: 2, flag: 'a' }, (err: any) => {
        console.error(err)
    });
}

function writeTickers(obj: any) {
    jsonfile.writeFile('./tickers.json', obj, { spaces: 2, flag: 'a' }, (err: any) => {
        console.error(err)
    });
}

function writeUpdates(obj: any) {
    jsonfile.writeFile('./updates.json', obj, { spaces: 2, flag: 'a' }, (err: any) => {
        console.error(err)
    });
}
