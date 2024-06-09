const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const multer = require("multer");

let imagepath = '';
let imagepathArray = [];

let storage = multer.diskStorage({
  destination: function (req, file, done) {
    //done(null, './public/image');
    done(null, './public/uploads');
  },
  filename: function (req, file, done) {
    done(null, file.originalname);
  }
});

var upload = multer({ storage: storage });

var multipleUpload = upload.fields([
  { name : 'picture', maxCount: 1 }, 
  { name : 'pictures', maxCount: 3 },
  { name : 'file', maxCount: 1 }
])

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

/* 이미지 하나 첨부
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
*/

// 다중 이미지 저장 api
router.post("/board", multipleUpload, function (req, res) {
  const db = req.app.locals.db;

  if (req.files['picture']) {
    imagepathArray.push('\\' + req.files['picture'][0].path);
  }
  if (req.files['pictures']) {
    req.files['pictures'].forEach(file => {
      imagepathArray.push('\\' + file.path);
    });
  }
  if (req.files['file']) {
    imagepathArray.push('\\' + req.files['file'][0].path);
  }

  db.collection("hw3board").insertOne({
    title: req.body.title,
    content: req.body.content,
    date: req.body.someDate,
    paths: imagepathArray // 여러 이미지 경로 배열을 저장
  })
  .then((result) => {
    console.log(result);
    console.log("데이터 추가 성공");
    imagepathArray = []; // 이미지 경로 배열 초기화
    res.redirect("/board/list");
  })
  .catch((err) => {
    console.log("데이터 추가 실패:", err);
    res.status(500).send("데이터 추가 실패");
  });
});

router.get("/board/detail/:id", function (req, res) {
  const db = req.app.locals.db;

  const id = new ObjectId(req.params.id);
  console.log(id);
  db.collection("hw3board").findOne({ _id: id })
    .then((result) => {
      console.log(result);
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
  console.log("PUT request received");
  const db = req.app.locals.db;
  const id = new ObjectId(req.params.id);
  //const id = req.body.id;

  db.collection("hw3board").updateOne(
    { _id: id },
    { 
      $set: { 
        title: req.body.title, 
        content: req.body.content, 
        date: req.body.someDate , 
        //path: req.body.imagepath
        paths: req.body.imagepathArray ? req.body.imagepathArray.split(',') : [] // 파일 경로 배열을 저장
      } 
    }
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

/* 
router.post('/photo', upload.single('picture'), function (req, res) {
  
  if (!req.file) {
    console.log("No file uploaded");
    return res.redirect("/board");
  }

  console.log("req.file.path : " + req.file.path);
  imagepath = '\\' + req.file.path;
});
*/
module.exports = router;