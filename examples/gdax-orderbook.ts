import * as GTT from '../src';
import { GDAXFeed } from "../src/exchanges";
import { LiveBookConfig, LiveOrderbook, SkippedMessageEvent, TradeMessage } from "../src/core";
import { Ticker } from "../src/exchanges/PublicExchangeAPI";
import { CumulativePriceLevel } from "../src/lib";

const product = 'ETH-USD';
const logger = GTT.utils.ConsoleLoggerFactory();
const printOrderbook = GTT.utils.printOrderbook;
const printTicker = GTT.utils.printTicker;
/*
 Simple demo that sets up a live order book and then periodically prints some stats to the console.
 */

let tradeVolume: number = 0;

GTT.Factories.GDAX.FeedFactory(logger, [product]).then((feed: GDAXFeed) => {
    // Configure the live book object
    const config: LiveBookConfig = {
        product: product,
        logger: logger
    };
    const book = new LiveOrderbook(config);
    book.on('LiveOrderbook.snapshot', () => {
        logger.log('info', 'Snapshot received by LiveOrderbook Demo');
        console.log(printOrderbook(book));
        // setInterval(() => {
        //     console.log(printOrderbook(book));
        //     printOrderbookStats(book);
        //     logger.log('info', `Cumulative trade volume: ${tradeVolume.toFixed(4)}`);
        // }, 5000);
    });
    book.on('LiveOrderbook.ticker', (ticker: Ticker) => {
        console.log('got ticker', ticker)
        //console.log(printTicker(ticker));
    });
    book.on('LiveOrderbook.trade', (trade: TradeMessage) => {
        console.log('got trade', trade)
        tradeVolume += +(trade.size);
    });
    book.on('LiveOrderbook.skippedMessage', (details: SkippedMessageEvent) => {
        // On GDAX, this event should never be emitted, but we put it here for completeness
        console.log('SKIPPED MESSAGE', details);
        console.log('Reconnecting to feed');
        feed.reconnect(0);
    });
    book.on('end', () => {
        console.log('Orderbook closed');
    });
    book.on('error', (err) => {
        console.log('Livebook errored: ', err);
        feed.pipe(book);
    });
    feed.pipe(book);
});

function printOrderbookStats(book: LiveOrderbook) {
    console.log(`Number of bids:       \t${book.numBids}\tasks: ${book.numAsks}`);
    console.log(`Total ${book.baseCurrency} liquidity: \t${book.bidsTotal.toFixed(3)}\tasks: ${book.asksTotal.toFixed(3)}`);
    let orders: CumulativePriceLevel[] = book.ordersForValue('buy', 100, false);
    console.log(`Cost of buying 100 ${book.baseCurrency}: ${orders[orders.length - 1].cumValue.toFixed(2)} ${book.quoteCurrency}`);
    orders = book.ordersForValue('sell', 1000, true);
    console.log(`Need to sell ${orders[orders.length - 1].cumSize.toFixed(3)} ${book.baseCurrency} to get 1000 ${book.quoteCurrency}`);
}
