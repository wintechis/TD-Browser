const express = require("express");
const Router = express.Router();
const path = require("path");
const td = require("../td/mirobot_td");
const longpoll = require("express-longpoll")(Router);
longpoll.create("/mirobot/events/red_box");
longpoll.create("/mirobot/events/blue_box");
longpoll.create("/mirobot/events/green_box");
longpoll.create("/mirobot/events/yellow_box");
longpoll.create("/mirobot/properties/holding_box/observeproperty");
const connections = {
  events: { red: [], green: [], yellow: [], blue: [] },
  properties: { holding_box: [] },
};
const property = {
  holding_box: false,
  boxes: ["yellow", "red", "blue", "green"],
  current_box: "none",
};
module.exports = (io) => {
  const mirobotSocket = io.of("/client/mirobot");
  mirobotSocket.on("connection", async (socket) => {
    mirobotSocket.to(socket.id).emit("status", property);
  });
  Router.get("/mirobot", (req, res) => {
    res.json(td);
  });
  Router.get("/client/mirobot", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../public/mirobot/index.html"));
  });
  Router.get("/mirobot/properties/holding_box", (req, res) => {
    res.send(property.holding_box);
  });
  Router.get("/mirobot/properties/boxes", (req, res) => {
    res.send(property.boxes);
  });
  Router.get("/mirobot/properties/current_box", (req, res) => {
    res.send(property.current_box);
  });
  Router.post("/mirobot/actions/drop_box", (req, res) => {
    if (property.holding_box === false) {
      res.status(400).send({
        message: "Error : there is no box to drop",
      });
    }
    property.holding_box = false;
    mirobotSocket.emit("drop_box");
    longpoll.publish(
      `/mirobot/properties/holding_box/observeproperty`,
      property.holding_box
    );
    longpoll.publish(
      `/mirobot/events/${property.current_box}_box`,
      `${property.current_box} box was dropped`
    );
    property.current_box = "none";
  });
  Router.post("/mirobot/actions/pick_box", express.text(), (req, res) => {
    const boxesEnum = ["red", "green", "blue", "yellow"];
    const boxIndex =
      typeof req.body === "string" ? boxesEnum.indexOf(req.body) : -1;
    if (boxIndex === -1) {
      res
        .status(400)
        .send({
          message: "Error : wrong type or outside the allowed enum",
        })
        .end();
    }
    if (property.holding_box === true) {
      res
        .status(400)
        .send({
          message: "Error : you need to drop the current box first",
        })
        .end();
    }
    const box = req.body;
    property.holding_box = true;
    property.current_box = box;
    mirobotSocket.emit("pick_box", box);

    longpoll.publish(
      `/mirobot/properties/holding_box/observeproperty`,
      property.holding_box
    );
    longpoll.publish(`/mirobot/events/${box}_box`, `${box} box was picked`);
  });
  return Router;
};
