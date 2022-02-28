const express = require("express");
const db = require("../models");
const router = express.Router();
const cryptojs = require("crypto-js");
require("dotenv").config();
const bcrypt = require("bcrypt");

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
  const user = await db.user.findOne({ where: { email: req.body.email } });
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

router.get("/profile", (req, res) => {
  res.render("users/profile.ejs");
});

module.exports = router;
