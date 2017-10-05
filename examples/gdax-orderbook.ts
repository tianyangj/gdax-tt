import * as GTT from '../src';
import { GDAXFeed } from "../src/exchanges";
import { LiveBookConfig, LiveOrderbook, SkippedMessageEvent, TradeMessage } from "../src/core";
import { Ticker } from "../src/exchanges/PublicExchangeAPI";
import { CumulativePriceLevel } from "../src/lib";

const product = 'ETH-USD';
const logger = GTT.utils.ConsoleLoggerFactory();

const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb://tianyangj:qwer1234@gdax-shard-00-00-xfxjs.mongodb.net:27017,gdax-shard-00-01-xfxjs.mongodb.net:27017,gdax-shard-00-02-xfxjs.mongodb.net:27017/gdax?ssl=true&replicaSet=gdax-shard-0&authSource=admin';

MongoClient.connect(uri, (err, db) => {

    if (err) {
        console.log('MongoDB failed');
        db.close();
    }

    const orderbookCollection = db.collection('orderbook');

    GTT.Factories.GDAX.FeedFactory(logger, [product]).then((feed: GDAXFeed) => {
        // Configure the live book object
        const config: LiveBookConfig = {
            product: product,
            logger: logger
        };
        const book = new LiveOrderbook(config);

        book.on('LiveOrderbook.trade', (trade: TradeMessage) => {
            const state = book.state();
            let temp: any = {
                ...trade,
                orderbook: {
                    bids: [],
                    asks: []
                }
            };
            temp.orderbook.bids = state.bids.slice(0, 20).map(bid => {
                return {
                    price: bid.price.toString(),
                    size: bid.totalSize.toString()
                };
            });
            temp.orderbook.asks = state.asks.slice(0, 20).map(ask => {
                return {
                    price: ask.price.toString(),
                    size: ask.totalSize.toString()
                };
            });
            let buyOrders = book.ordersForValue('buy', 100, false);
            let buyOrder = buyOrders[buyOrders.length - 1];
            let sellOrders = book.ordersForValue('sell', 100, false);
            let sellOrder = sellOrders[sellOrders.length - 1];
            temp.buy = Number(buyOrder.cumValue.toFixed(2))/100;
            temp.buyDiff = Math.abs(temp.buy - Number(temp.price));
            temp.sell = Number(sellOrder.cumValue.toFixed(2))/100;
            temp.sellDiff = Math.abs(temp.sell - Number(temp.price));
            orderbookCollection.insertMany([temp], () => { });
        });
        feed.pipe(book);
    });
});