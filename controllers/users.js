const express = require("express");
const db = require("../models");
const router = express.Router();
const cryptojs = require("crypto-js");
require("dotenv").config();
const bcrypt = require("bcrypt");
const axios = require("axios");

router.get("/new", (req, res) => {
  res.render("users/new.ejs");
});

router.post("/", async (req, res) => {
  const [newUser, created] = await db.user.findOrCreate({
    where: { email: req.body.email },
  });
  if (!created) {
    console.log("user already exists");
    res.render("users/login.ejs", {
      error: "Looks like you already have an account! Try logging in :)",
    });
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    newUser.password = hashedPassword;
    await newUser.save();
    const encryptedUserId = cryptojs.AES.encrypt(
      newUser.id.toString(),
      process.env.SECRET
    );
    const encryptedUserIdString = encryptedUserId.toString();
    res.cookie("userId", encryptedUserIdString);
    res.redirect("/");
  }
});

router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post("/login", async (req, res) => {
  const user = await db.user.findOne({
    where: { email: req.body.email, userName: req.body.userName },
  });
  if (!user) {
    console.log("user not found");
    res.render("users/login", { error: "Invalid email/password" });
  } else if (!bcrypt.compareSync(req.body.password, user.password)) {
    console.log("password incorrect");
    res.render("users/login", { error: "Invalid email/password" });
  } else {
    console.log("logging in the user!!!");
    const encryptedUserId = cryptojs.AES.encrypt(
      user.id.toString(),
      process.env.SECRET
    );
    const encryptedUserIdString = encryptedUserId.toString();
    res.cookie("userId", encryptedUserIdString);
    res.redirect("/");
  }
});

router.get("/logout", (req, res) => {
  console.log("logging out");
  res.clearCookie("userId");
  res.redirect("/");
});

async function usdTickers() {
  return (
    await axios.get("https://api.blockchain.com/v3/exchange/tickers")
  ).data
    .filter((ticker) => {
      const { symbol } = ticker;
      return symbol.endsWith("USD") || symbol.endsWith("USDT");
    })
    .map((ticker) => ({
      symbol: ticker.symbol,
      price: ticker.last_trade_price,
    }));
}

async function userCryptoTickers(res, tickers) {
  return tickers.filter((ticker) => {
    const { symbol } = ticker;
    const userCryptos = res.locals.user.dataValues.cryptos;
    for (let i = 0; i < userCryptos.length; i++) {
      if (symbol === userCryptos[i].symbol.trim()) return true;
    }
    return false;
  });
}
router.get("/profile", async (req, res) => {
  try {
    const { q } = req.query;
    const tickers = await usdTickers();
    const userTickers = await userCryptoTickers(res, tickers);
    if (!q) {
      res.render("users/profile.ejs", {
        tickers: [],
        userTickers,
      });
    } else {
      const searchedTickers = tickers.filter((ticker) => {
        const { symbol } = ticker;
        return symbol.toLowerCase().startsWith(q.toLowerCase());
      });
      res.render("users/profile.ejs", {
        tickers: searchedTickers,
        userTickers,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

// router.get("/profile", async (req, res) => {
//   const { q } = req.query;
//   if (!q) {
//     res.render("users/profile.ejs", { tickers: [] });
//     return;
//   }
//   try {
//     const response = await axios.get(
//       "https://api.blockchain.com/v3/exchange/tickers"
//     );
//     const tickers = response.data
//
//
//     // console.log(res.locals.user);
//     res.render("users/profile.ejs", { tickers });
//   } catch (error) {
//     console.log(error);
//   }
// });

router.post("/profile", async (req, res) => {
  try {
    await res.locals.user.createCrypto(req.body);
    res.redirect("/users/profile");
  } catch (error) {
    console.log(error);
  }
});

router.get("/profile", async (req, res) => {
  try {
    const profileUser = await db.user.findOne({
      where: { id: req.params.id },
      inculde: [db.crypto],
    });
    const favorites = await profileUser.getCryptos();
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
