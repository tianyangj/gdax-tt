import * as GTT from '../src';
import { GDAXFeed } from "../src/exchanges";
import { OrderbookMessage } from "../src/core";

const logger = GTT.utils.ConsoleLoggerFactory();
const products: string[] = ['ETH-USD'];
const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb://tianyangj:qwer1234@gdax-shard-00-00-xfxjs.mongodb.net:27017,gdax-shard-00-01-xfxjs.mongodb.net:27017,gdax-shard-00-02-xfxjs.mongodb.net:27017/gdax?ssl=true&replicaSet=gdax-shard-0&authSource=admin';

MongoClient.connect(uri, function (err, db) {

    if (err) {
        console.log('MongoDB failed');
        db.close();
    }

    const tradeCollection = db.collection('trade');
    const tickerCollection = db.collection('ticker');
    GTT.Factories.GDAX.FeedFactory(logger, products).then((feed: GDAXFeed) => {
        feed.on('data', (msg: OrderbookMessage) => {
            if (msg.type === 'trade') {
                tradeCollection.insertMany([msg], () => { });
            }
            if (msg.type === 'ticker') {
                tickerCollection.insertMany([msg], () => { });
            }
        });
    }).catch((err: Error) => {
        logger.log('error', err.message);
        process.exit(1);
    });

});