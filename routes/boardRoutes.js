const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const multer = require("multer");

router.get("/board", function (req, res) {
  res.render("createBoard.ejs");
});

router.get("/board/list", function (req, res) {
  const db = req.app.locals.db;

  db.collection("hw3board").find().toArray()
    .then((result) => {
      res.render("boardList.ejs", { data: result });
    });
});

router.post("/board", function (req, res) {
  const db = req.app.locals.db;

  db.collection("hw3board").insertOne({
    title: req.body.title,
    content: req.body.content,
    date: req.body.someDate,
    path: imagepath
  })
  .then((result) => {
    console.log(result);
    console.log("데이터 추가 성공");
  });
  res.redirect("/board/list");
});

router.get("/board/detail/:id", function (req, res) {
  const db = req.app.locals.db;

  const id = new ObjectId(req.params.id);
  db.collection("hw3board").findOne({ _id: id })
    .then((result) => {
      res.render("boardDetail.ejs", { data: result });
    });
});

router.get("/board/edit/:id", function (req, res) {
  const db = req.app.locals.db;

  const id = new ObjectId(req.params.id);
  db.collection("hw3board").findOne({ _id: id })
    .then((result) => {
      res.render("boardEdit.ejs", { data: result });
    });
});

router.put("/board/:id", function (req, res) {
  const db = req.app.locals.db;

  const id = new ObjectId(req.params.id);
  db.collection("hw3board").updateOne(
    { _id: id },
    { $set: { title: req.body.title, content: req.body.content, date: req.body.someDate } }
  )
  .then((result) => {
    res.redirect("/board/list");
  })
  .catch((err) => {
    console.log(err);
  });
});

router.delete("/board/:id", function (req, res) {
  const db = req.app.locals.db;

  const id = new ObjectId(req.params.id);
  db.collection("hw3board").deleteOne({ _id: id })
    .then((result) => {
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send();
    });
});

router.get('/search', function (req, res) {
  const db = req.app.locals.db;

  const searchRegex = new RegExp(req.query.value, 'i');
  db.collection("hw3board").find({ title: { $regex: searchRegex } }).toArray()
    .then((result) => {
      res.render("searchBoard.ejs", { data: result });
    });
});

let storage = multer.diskStorage({
  destination: function (req, file, done) {
    done(null, './public/image');
  },
  filename: function (req, file, done) {
    done(null, file.originalname);
  }
});

let upload = multer({ storage: storage });

router.post('/photo', upload.single('picture'), function (req, res) {
  
  if (!req.file) {
    console.log("No file uploaded");
    return res.redirect("/board");
  }

  console.log("req.file.path : " + req.file.path);
  imagepath = '\\' + req.file.path;
});

module.exports = router;