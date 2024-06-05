const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;
const sha = require("sha256");
var path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
let multer = require('multer');
let session = require("express-session");
const { error } = require("console");

const url = "mongodb://localhost:27017/myboard";
let mydb;
const app = express();

mongoclient
  .connect(url)
  .then((client) => {
    mydb = client.db("myboard");
    app.listen(8080, function () {
      console.log("포트 8080으로 서버 실행");
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.use(
  session({
    secret: "dkufe8938493j4e08349u",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use('/public', express.static(path.join(__dirname, "public")));

let storage = multer.diskStorage({
  destination : function(req, file, done){
    done(null, './public/image')
  },
  filename : function(req, file, done){
    done(null, file.originalname)
  }
})
let upload = multer({storage:storage});

app.get("/book", function (req, res) {

  res.send("도서 목록 관련 페이지입니다.");
});

app.get("/", function (req, res) {

  if (req.session.user) {
    console.log("세션 유지");
    res.render("index.ejs", { user: req.session.user });
  } else {
    console.log("user : null");
    res.render("index.ejs", { user: null });
  }
});

// board 생성 페이지
app.get("/board", function (req, res) {

  res.render("createBoard.ejs");
});

// board 목록 페이지
app.get("/board/list", function (req, res) {

  mydb
    .collection("hw3board")
    .find()
    .toArray()
    .then((result) => {
      console.log(result);
      res.render("boardList.ejs", { data: result });
    });
});

// board 생성 요청
app.post("/board", function (req, res) {

  console.log(req.body.title);
  console.log(req.body.content);

  mydb
    .collection("hw3board")
    .insertOne({
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

let imagepath = '';

app.post('/photo', upload.single('picture'), function(req, res){
  console.log("req.file.path : "+ req.file.path);
  imagepath = '\\' + req.file.path;
})

// board content 페이지 - 수정, 삭제 제공
app.get("/board/detail/:id", function (req, res) {
  console.log(req.params.id);
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("hw3board")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("boardDetail.ejs", { data: result });
    });
});

// board 수정 페이지
app.get("/board/edit/:id", function (req, res) {
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("hw3board")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("boardEdit.ejs", { data: result });
    });
});

// board 수정 update
app.put("/board/:id", function (req, res) {
  console.log(req.params);
  req.body.id = new ObjId(req.params.id);
  mydb
    .collection("hw3board")
    .updateOne(
      { _id: req.body.id },
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          date: req.body.someDate,
        },
      }
    )
    .then((result) => {
      console.log("수정완료");
      res.redirect("/board/list");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.delete("/board/:id", function (req, res) {
  console.log('delete입니다' + req.params.id);
  let id;
  try {
    id = new ObjId(req.params.id)
  } catch(err) {
    return res.status(400).send({ error: 'ID 없습니다.'});
  }

  mydb
    .collection("hw3board")
    .deleteOne({ _id: id })
    .then((result) => {
      console.log("삭제완료");
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send();
    });
});