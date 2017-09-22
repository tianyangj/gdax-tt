import { GDAXExchangeAPI } from '../src/exchanges/gdax/GDAXExchangeAPI';
import { DefaultAPI } from '../src/factories/gdaxFactories';

const gdax: GDAXExchangeAPI = DefaultAPI(null);
const product = 'ETH-USD';

function logError(err: any): void {
    console.log(err.message, err.response ? `${err.response.status}: ${err.response.body.message}` : '');
}

console.log(product);

// console.log(`GDAXExchangeAPI.apiURL`, gdax.apiURL);

// gdax.loadProducts().then(products => {
//     console.log(`GDAXExchangeAPI.loadProducts()`, products.map(product => product.id));
// }).catch(logError);

// gdax.loadMidMarketPrice(product).then(price => {
//     console.log(`GDAXExchangeAPI.loadMidMarketPrice(${product})`, price);
// }).catch(logError);

gdax.loadOrderbook(product).then(book => {
    console.log('book', book);
}).catch(logError);
