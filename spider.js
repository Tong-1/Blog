const superagent = require("superagent");
const cheerio = require("cheerio");
const schedule = require("node-schedule");
const connection = require("./mysql");

function nowlist() { // 获取电影列表
  let list = [];
  return new Promise((resolve, reject) => {
    superagent
      .get("https://movie.douban.com/cinema/nowplaying/chengdu/")
      .end((err, res) => {
        if (!err) {
          let $ = cheerio.load(res.text);
          $ = cheerio.load($(".lists", "#nowplaying").html());
          $(".list-item").each((i, elem) => {
            // 未隐藏的电影
            list.push([
              $(".poster", elem).find("img").attr("src"), // 图片链接
              $(".poster", elem).children("a").attr("href"), // 豆瓣链接
              $(elem).attr("data-title") ,
              $(elem).attr("data-release"), 
              $(elem).attr("data-director"), 
              $(elem).attr("data-actors"), 
              $(elem).attr("data-region"), 
              $(elem).attr("data-duration"), 
              $(elem).attr("data-score") 
            ]);
          });
          // $(".hidden").each((i, elem) => {
          //   // 隐藏的电影
          //   list.push([
          //     $(".poster", elem)
          //       .find("img")
          //       .attr("src"), // 图片链接
          //     $(".poster", elem)
          //       .children("a")
          //       .attr("href"), // 豆瓣链接
          //     $(elem).attr("data-title") +
          //       "(" +
          //       $(elem).attr("data-release") +
          //       ")", // 电影名字
          //     $(elem).attr("data-director"), // 导演
          //     $(elem).attr("data-actors"), // 演员
          //     $(elem).attr("data-region"), // 制片国家/地区
          //     $(elem).attr("data-duration"), // 时间
          //     $(elem).attr("data-score") // 评分
          //   ]);
          // });
          resolve(list);
        }
      });
  });
}

function nowmove(link) { // 获取语言和简介
  let info = [];
  return new Promise((resolve, reject) => {
    superagent.get(link).end((err, res) => {
      if (!err) {
        let $ = cheerio.load(res.text);
        let re1 = /(\s)(©豆瓣)*/g;
        let re2 = /(\s)*(导演)*(编剧)*(主演)*(类型)*(国家\/地区)*(语言)*(日期)*(上映片长)*/gm;
        info = [
          $("#link-report")
            .text()
            .replace(re1, ""), // 简介
          $("#info")
            .text()
            .replace(re2, "")
            .split(":", 8)[4], //类型
          $("#info")
            .text()
            .replace(re2, "")
            .split(":", 8)[6] //语言
        ];
        resolve(info);
      }
    });
  });
}

function scheduleCronstyle() { // 定时任务
  
  schedule.scheduleJob("50 6 16 * * *", async function() {
    //获取所有电影信息
    let movie = await nowlist();
    let all = []; // 电影信息的集合
    let addsql = ""; // sql操作语句
    if (movie) {
      console.log(55);
      // 通过豆瓣链接循环获取每个电影的信息
      connection.query("drop table if exists movie");
      connection.query("create table if not exists movie(id int auto_increment primary key,img text,db text,name char(30),releas char(20),director char(30),actors text,region char(30),duration char(30),score int(4),report text,type char(20),language char(30))");
      for (let i in movie) {
        let info = await nowmove(movie[i][1]);
        all = movie[i].concat(info);
        console.log(i);
        addsql = "insert into movie(img, db, name, releas, director, actors, region, duration, score, report, type,language)values(?,?,?,?,?,?,?,?,?,?,?,?)";
        connection.query(addsql, all, (err, result) => {});
      }
    } else console.log("电影列表获取失败");
  });
}

module.exports = scheduleCronstyle();
