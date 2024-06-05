const express = require("express");
const router = express.Router();
const sha = require("sha256");

router.get("/login", function (req, res) {
  if (req.session.user) {
    res.render("index.ejs", { user: req.session.user });
  } else {
    res.render("login.ejs");
  }
});

router.post("/login", function (req, res) {
  const db = req.app.locals.db;
  db.collection("account").findOne({ userid: req.body.userid })
    .then((result) => {
      if (result && result.userpw == sha(req.body.userpw)) {
        req.session.user = req.body;
        res.render("index.ejs", { user: req.session.user });
      } else {
        res.render("errorLogin.ejs");
      }
    })
    .catch((err) => {
      console.error('데이터베이스 조회 중 오류 발생:', err);
      res.status(500).send('서버 오류가 발생했습니다.');
    });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.render("index.ejs", { user: null });
});

router.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

router.post("/signup", function (req, res) {
  const db = req.app.locals.db;
  db.collection("account").insertOne({
    userid: req.body.userid,
    userpw: sha(req.body.userpw),
    usergroup: req.body.usergroup,
    useremail: req.body.useremail,
  })
  .then((result) => {
    console.log("회원가입 성공");
  });
  res.redirect("/");
});

module.exports = router;