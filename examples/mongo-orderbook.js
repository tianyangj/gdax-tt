const MongoClient = require('mongodb').MongoClient;
const groupBySecond = require('./modules/group-by-second');
const groupByMinute = require('./modules/group-by-minute');
const applyIQR = require('./modules/apply-iqr');

const uri = 'mongodb://tianyangj:qwer1234@gdax-shard-00-00-xfxjs.mongodb.net:27017,gdax-shard-00-01-xfxjs.mongodb.net:27017,gdax-shard-00-02-xfxjs.mongodb.net:27017/gdax?ssl=true&replicaSet=gdax-shard-0&authSource=admin';

MongoClient.connect(uri, function (err, db) {

    if (err) {
        console.log('MongoDB failed');
        db.close();
    }

    findOrderbook(db)
});

function findOrderbook(db) {
    const orderbook = db.collection('orderbook');
    const projections = {
        tradeId: true,
        time: true,
        side: true,
        price: true,
        size: true,
        buyDiff: true,
        sellDiff: true
    };
    const skip = 15000;
    const limit = 10000;
    orderbook.find({}, projections).skip(skip).limit(limit).toArray(function (err, data) {
        if (err) {
            console.log('orderbook failed');
            db.close();
        }
        console.log(data);
        let result = [];
        result = normalizeData(data);
        result = groupBySecond(result);
        result = applyIQR(result);
        result = groupByMinute(result);
        result = applyIQR(result);
        console.log(result);
    });
}

function normalizeData(items) {
    return items.map(item => {
        return {
            id: item.tradeId,
            buyDiff: item.buyDiff,
            sellDiff: item.sellDiff,
            time: item.time.toISOString(),
            side: item.side,
            price: Number(item.price),
            size: Number(item.size),
            amount: Number(item.price) * Number(item.size)
        };
    });
}