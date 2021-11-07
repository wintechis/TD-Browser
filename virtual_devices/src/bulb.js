"use strict";
const express = require("express");
const Router = express.Router();
const path = require("path");
const td = require("../td/bulb_td");
const bulb = { status: false };
module.exports = (io, longpoll) => {
  const bulbWebSocket = io.of("/client/bulb");
  bulbWebSocket.on("connection", async (socket) => {
    bulbWebSocket.to(socket.id).emit("status", bulb.status);
  });
  Router.get("/bulb", (req, res) => res.json(td));
  Router.get("/client/bulb", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../public/bulb/index.html"));
  });
  Router.get("/bulb/properties/status", (req, res) => {
    res.send(bulb.status === false ? "Off" : "On");
  });
  Router.post("/bulb/actions/toggle", (req, res) => {
    return new Promise(function (resolve, reject) {
      bulb.status = bulb.status === false ? true : false;
      bulbWebSocket.emit("status", bulb.status);
      resolve();
      res.send(bulb.status).end();
    });
  });
  return Router;
};
