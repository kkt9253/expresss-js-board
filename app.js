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
  if (!req.file) {
    // 파일이 업로드되지 않았을 경우
    console.log("No file uploaded");
    return res.redirect("/board");
  }

  console.log("req.file.path : " + req.file.path);
  imagepath = '\\' + req.file.path;
});

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

app.get("/login", function (req, res) {

  console.log("req.session");
  console.log(req.session);
  if (req.session.user) {
    console.log("세션 유지");
    res.render("index.ejs", { user: req.session.user });
  } else {
  console.log("로그인 페이지");
  res.render("login.ejs");
  }
});

app.post("/login", function (req, res) {

  console.log("아이디 : " + req.body.userid);
  console.log("비밀번호 : " + req.body.userpw);

  mydb.collection("account").findOne({ userid: req.body.userid })
    .then((result) => {
      if (result && result.userpw == sha(req.body.userpw)) {
        req.session.user = req.body;
        console.log("새로운 로그인");
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

app.get("/logout", function (req, res) {

  console.log("로그아웃");
  req.session.destroy();
  res.render("index.ejs", { user: null });
});

app.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

app.post("/signup", function (req, res) {
  console.log(req.body.userid);
  console.log(sha(req.body.userpw));
  console.log(req.body.usergroup);
  console.log(req.body.useremail);

  mydb
    .collection("account")
    .insertOne({
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

app.get('/search', function(req, res){
  console.log(req.query);
  console.log(req.query.value);
  // 검색어를 정규 표현식으로 변환하여 부분 일치를 위한 쿼리 생성
  const searchRegex = new RegExp(req.query.value, 'i'); // 'i' 플래그는 대소문자 구분하지 않음을 의미함
  mydb
    .collection("hw3board")
    .find({ title: { $regex: searchRegex } })
    .toArray()
    .then((result) => {
      console.log(result);
      res.render("searchBoard.ejs", { data: result });
    })
})
