const axios = require("axios");
const res = require("express/lib/response");

async function getPrices() {
  const tickersRes = await axios.get(
    "https://api.blockchain.com/v3/exchange/tickers"
  );
  return tickersRes.data
    .filter((ticker) => {
      const { symbol } = ticker;
      return symbol.endsWith("USD") || symbol.endsWith("USDT");
      console.log(ticker);
    })
    .map((ticker) => ({
      symbol: ticker.symbol,
      price: ticker.last_trade_price,
    }));
  res.render();
}
