require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");

const url = "https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki";
const characterUrl = "https://kimetsu-no-yaiba.fandom.com/wiki/";

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

// get all charater
app.get("/v1", (req, res) => {
  let thumbnails = [];
  /**
   * htpp://localhost:8000/v1?limit=5
   * query <=> ?
   * req.query.limit
   */

  const limit = parseInt(req.query.limit);

  try {
    axios.get(url).then((resq) => {
      const html = resq.data;
      const $ = cheerio.load(html);
      $(".portal", html).each(function () {
        const name = $(this).find("a").attr("title");
        const url = $(this).find("a").attr("href");
        const image = $(this).find("a > img").attr("data-src");
        thumbnails.push({
          name: name,
          url: "http://localhost:8000/v1" + url.split("/wiki")[1],
          image: image,
        });
      });
      if (limit && limit > 0) {
        return res.status(200).json(thumbnails.slice(0, limit));
      }
      return res.status(200).json(thumbnails);
    });
  } catch (error) {
    console.log(error);
  }
});

// get a character
app.get("/v1/:charater", (req, res) => {
  let url = characterUrl + req.params.charater;
  const titles = [];
  const details = [];
  const charecter = [];
  const charecterObj = {};
  const galleries = [];

  try {
    axios.get(url).then(async (resp) => {
      const html = resp.data;
      const $ = cheerio.load(html);
      await $("aside", html).each(function () {
        // get banner image
        const image = $(this).find("img").attr("src");

        // get the title of charecter title
        $(this)
          .find("section > div > h3")
          .each(function () {
            titles.push($(this).text());
          });

        // get charecter detail
        $(this)
          .find("section > div > div")
          .each(function () {
            details.push($(this).text());
          });

        if (image !== undefined) {
          titles.forEach((item, index) => {
            charecterObj[item.toLowerCase()] = details[index];
          });
          charecter.push({
            name: req.params.charater.replace("_", " "),
            image,
          });
        }
      });

      //GET GALLARY
      $(".wikia-gallery-item", html).each(function () {
        const gallary = $(this).find("a > img").attr("data-src");
        galleries.push(gallary);
      });

      charecter.push({
        galleries,
        charecterObj,
      });
      res.send(charecter);
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 8000, () => {
  console.log("Server is running...");
});
