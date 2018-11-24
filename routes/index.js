const express = require("express");
const router = express.Router();
const download = require("download-file");
const excelToJson = require("convert-excel-to-json");
const fs = require("fs");

const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyCuk2d2fTSNcW00vsinu3jJQOlPu-WBmy4",
  Promise: Promise
});

// Download dataBase points of charge Gob Page
var url =
  "https://sedeaplicaciones.minetur.gob.es/Greco/DatosRISP.aspx?fichero=exportarexcel";

// Time for setInterval
var dayInMilliseconds = 1000 * 60 * 60 * 24;

// Options of the library will download the dataBase of the Gob
var options = {
  directory: "./public/excels/",
  filename: "epoints.xlsx"
};

// SetInterval that will download once a day the dataBase of the Gob

setInterval(() => {
  download(url, options, function(err) {
    if (err) throw err;
  });

  // Library that will convert the xls downloaded into a Json file

  const resultExcelToJson = excelToJson({
    sourceFile: "./public/excels/epoints.xlsx",
    header: {
      rows: 1
    },
    columnToKey: {
      A: "{{A1}}",
      B: "{{B1}}",
      C: "{{C1}}",
      D: "{{D1}}",
      E: "{{E1}}",
      F: "{{F1}}",
      G: "{{G1}}"
    }
  });

  // Iterate each point of charge get its directions and remplace by the location calling the Google Maps API

  for (let i in resultExcelToJson) {
    for (let j in resultExcelToJson[i]) {
      googleMapsClient
        .geocode({
          address: `${resultExcelToJson[i][j].Direccion}, ${
            resultExcelToJson[i][j].Provincia
          }`
        })
        .asPromise()
        .then(response => {
          var location = response.json.results[0].geometry.location;
          resultExcelToJson[i][j].Direccion = location;
        })
        .catch(err => {
          console.log(err);
        });
    }
  }

  // Once it makes all the changes save the new Json file into the folder

  setTimeout(() => {
    fs.writeFile("./epoints.json", JSON.stringify(resultExcelToJson), err => {
      if (!err) {
        console.log("done");
      }
    });
  }, 6000);
}, dayInMilliseconds);

/* GET home page */

router.get("/", (req, res, next) => {
  res.render("index");
});

module.exports = router;
