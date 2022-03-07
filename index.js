const express = require("express");
const app = express();
const ejsLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const db = require("./models");
const cryptoJS = require("crypto-js");
const axios = require("axios");
const methodOverride = require("method-override");
require("dotenv").config();

// MIDDLEWARE
app.set("view engine", "ejs");
app.use(ejsLayouts);
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.use("/static", express.static(__dirname + "/static/"));
const PORT = process.env.PORT || 3000;

// AUTHENTICATION MIDDLEWARE
app.use(async (req, res, next) => {
  if (req.cookies.userId) {
    const decryptedId = cryptoJS.AES.decrypt(
      req.cookies.userId,
      process.env.SECRET
    );
    const decryptedIdString = decryptedId.toString(cryptoJS.enc.Utf8);
    const user = await db.user.findByPk(decryptedIdString, {
      include: [db.crypto, db.post],
    });
    res.locals.user = user;
  } else res.locals.user = null;
  next();
});

// CONTROLLERS
app.use("/users", require("./controllers/users"));

// ROUTES
app.get("/", async (req, res) => {
  try {
    const posts = await db.post.findAll({
      include: [db.user],
    });
    posts.reverse();
    const response = await axios.get(
      "https://api.blockchain.com/v3/exchange/tickers"
    );
    const tickers = response.data
      .filter((ticker) => {
        const { symbol } = ticker;
        return symbol.endsWith("USD") || symbol.endsWith("USDT");
      })
      .map((ticker) => ({
        symbol: ticker.symbol,
        price: ticker.last_trade_price,
      }));
    console.log(tickers);
    res.render("home.ejs", {
      tickers,
      posts,
      userId: res.locals.user && res.locals.user.id,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async (req, res) => {
  try {
    const newPost = await db.post.create({
      content: req.body.p,
      userId: res.locals.user.id,
    });
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.put("/:id", async (req, res) => {
  try {
    const post = await db.post.findOne({ where: { id: req.params.id } });
    if (post.userId === res.locals.user.id) {
      await post.update({
        content: req.body.content,
      });
    }
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});
app.delete("/:id", async (req, res) => {
  try {
    const post = await db.post.findOne({ where: { id: req.params.id } });
    if (post.userId === res.locals.user.id) {
      await post.destroy();
    }
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log("Project 2");
});
