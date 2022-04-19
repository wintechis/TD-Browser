"use strict";
const express = require("express");
const Router = express.Router();
const path = require("path");
const default_value = {
  status: { value: "off" },
  color: { red: 249, green: 246, blue: 231 },
  room: { value: "" },
};
let timeoutID;
const responses = { color: {}, room: {}, overheating: {} };
const bulb = {
  status: { ...default_value.status },
  color: { ...default_value.color },
  room: { ...default_value.room },
};
module.exports = (io, port) => {
  const td = require("../td/bulb_td")(port);
  const bulbWebSocket = io.of("/client/bulb");
  bulbWebSocket.on("connection", async (socket) => {
    bulbWebSocket.to(socket.id).emit("status", bulb.status.value, bulb.color);
  });
  Router.get("/bulb", (req, res) => res.json(td));
  Router.get("/client/bulb", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../public/bulb/index.html"));
  });
  Router.get("/bulb/properties/status", (req, res) => {
    res.send({ ...bulb.status });
  });
  Router.get("/bulb/properties/color", (req, res) => {
    res.status(200);
    res.json(bulb.color);
  });
  Router.put("/bulb/properties/color", (req, res) => {
    const { red, blue, green } = req.body;
    if (
      0 <= red &&
      red <= 255 &&
      0 <= green &&
      green <= 255 &&
      0 <= blue &&
      blue <= 255
    ) {
      bulb.color = { red, blue, green };
      bulbWebSocket.emit("status", bulb.status.value, bulb.color);
      res.status(200).end();
      Object.keys(responses.color).forEach((key) => {
        responses.color[key].send(bulb.room.value);
        responses.color[key].end();
      });
    } else {
      res.status(400).send({
        message: "DataError",
      });
    }
  });
  Router.get("/bulb/properties/color/observeproperty", (req, res) => {
    const id = uuid_generator();
    responses.color[id] = res;
    req.on("end", () => delete responses.color[id]);
  });

  Router.get("/bulb/properties/room", (req, res) => {
    res.send({ ...bulb.room });
  });
  Router.put("/bulb/properties/room", (req, res) => {
    const room = req.body.value;
    if (typeof room === "string") {
      bulb.room.value = room;
      res.status(200).end();
      Object.keys(responses.room).forEach((key) => {
        responses.room[key].json(bulb.room.value);
        responses.room[key].end();
      });
    } else {
      res.status(400).send({
        message: "DataError",
      });
    }
  });
  Router.get("/bulb/properties/room/observeproperty", (req, res) => {
    const id = uuid_generator();
    responses.room[id] = res;
    req.on("end", () => delete responses.room[id]);
  });
  Router.post("/bulb/actions/toggle", (req, res) => {
    bulb.status.value = bulb.status.value === "off" ? "on" : "Off";
    if (bulb.status.value === "on") {
      overheating();
    } else {
      clearTimeout(timeoutID);
    }
    bulbWebSocket.emit("status", bulb.status.value, bulb.color);
    res.json({});
  });
  Router.post("/bulb/actions/reset", (req, res) => {
    bulb.color = { ...default_value.color };
    bulb.room = { ...default_value.room };
    bulbWebSocket.emit("status", bulb.status.value, bulb.color);
    res.json();
  });
  Router.get("/bulb/events/overheating", (req, res) => {
    const id = uuid_generator();
    responses.overheating[id] = res;
    req.on("end", () => delete responses.overheating[id]);
  });
  Router.get("/bulb/readallproperties", (req, res) => {
    res.json(bulb);
  });
  return Router;
};

const uuid_generator = () => Date.now() + Math.random();
const overheating = () => {
  const emitEvent = () => {
    Object.keys(responses.overheating).forEach((key) => {
      responses.overheating[key].send();
    });
  };
  timeoutID = setTimeout(emitEvent, 4 * 3600000);
};
