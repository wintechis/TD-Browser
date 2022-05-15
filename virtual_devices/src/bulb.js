"use strict";
const express = require("express");
const Router = express.Router();
const path = require("path");
const default_value = {
  status: { value: "off" },
  color: { red: 249, green: 246, blue: 231 },
  room: { value: "" },
};
let power = true;
const responses = { color: {}, room: {}, power_on: {} };
const bulb = {
  status: { ...default_value.status },
  color: { ...default_value.color },
  room: { ...default_value.room },
};
module.exports = (io, port) => {
  const td = require("../td/bulb_td")(port);
  const bulbWebSocket = io.of("/client/bulb");
  bulbWebSocket.on("connection", async (socket) => {
    bulbWebSocket
      .to(socket.id)
      .emit("status", bulb.status.value, bulb.color, power);
    bulbWebSocket.to(socket.id).emit("initialPower", power, bulb.status);
    socket.on("updatePower", () => {
      power = !power;
      socket.broadcast.emit("updatePower", power);
      if (power) {
        Object.keys(responses.power_on).forEach((key) => {
          responses.power_on[key].json("Power is back on");
          responses.power_on[key].end();
        });
      }
    });
  });
  Router.get("/bulb", (req, res) => res.json(td));
  Router.get("/client/bulb", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../public/bulb/index.html"));
  });
  Router.get("/bulb/properties/status", powerMiddleware, (req, res) => {
    res.send({ ...bulb.status });
  });
  Router.get("/bulb/properties/color", powerMiddleware, (req, res) => {
    res.status(200);
    res.json(bulb.color);
  });
  Router.put("/bulb/properties/color", powerMiddleware, (req, res) => {
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
      bulbWebSocket.emit("status", bulb.status.value, bulb.color, power);
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
  Router.post("/bulb/actions/toggle", powerMiddleware, (req, res) => {
    bulb.status.value = bulb.status.value === "off" ? "on" : "off";
    bulbWebSocket.emit("status", bulb.status.value, bulb.color, power);
    res.end();
  });
  Router.post("/bulb/actions/reset", powerMiddleware, (req, res) => {
    bulb.color = { ...default_value.color };
    bulb.room = { ...default_value.room };
    bulbWebSocket.emit("status", bulb.status.value, bulb.color, power);
    res.end();
  });
  Router.get("/bulb/events/power_on", (req, res) => {
    const id = uuid_generator();
    responses.power_on[id] = res;
    req.on("end", () => delete responses.power_on[id]);
  });
  Router.get("/bulb/readallproperties", powerMiddleware, (req, res) => {
    res.json(bulb);
  });
  return Router;
};

function powerMiddleware(req, res, next) {
  if (power) {
    next();
  } else {
    res.status(500).json({ message: "OperationError: The power is off" });
  }
}
const uuid_generator = () => Date.now() + Math.random();
