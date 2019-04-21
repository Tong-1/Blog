const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const spider = require("./spider");
// const bodyParser = require("body-parser");

const app = express();

app.all("*", function(req, res, next) {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use("/user", require("./routes/user"));
app.use("/movie", require("./routes/movie"));
app.use("/addmovie", require("./routes/addmovie"));

module.exports = app;
// 200 列表查询成功
// 201 操作成功前台提示
// 250 额外情况