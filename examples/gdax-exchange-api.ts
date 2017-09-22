import { GDAXExchangeAPI } from '../src/exchanges/gdax/GDAXExchangeAPI';
import { DefaultAPI } from '../src/factories/gdaxFactories';

const gdax: GDAXExchangeAPI = DefaultAPI(null);
const product = 'ETH-USD';

function logError(err: any): void {
    console.log(err.message, err.response ? `${err.response.status}: ${err.response.body.message}` : '');
}

console.log(product);

// console.log(`GDAXExchangeAPI.apiURL\n`, gdax.apiURL);

// gdax.loadProducts().then(products => {
//     console.log(`GDAXExchangeAPI.loadProducts()\n`, products.map(product => product.id));
// }).catch(logError);

// gdax.loadMidMarketPrice(product).then(price => {
//     console.log(`GDAXExchangeAPI.loadMidMarketPrice(${product})\n`, price);
// }).catch(logError);

// gdax.loadTicker(product).then(ticker => {
//     console.log(`GDAXExchangeAPI.loadTicker(${product})\n`, ticker);
// }).catch(logError);
