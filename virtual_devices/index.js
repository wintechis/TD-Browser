"use strict";
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = 3001;
const cors = require("cors");
const { Server } = require("socket.io");
const io = new Server(server);
const mirobot = require("./src/mirobot")(io);
const bulb = require("./src/bulb")(io, port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/static", express.static("public"));
app.use("static/bulb", express.static("public/bulb"));
app.use(bulb);
app.use(mirobot);
app.all("/*", (req, res) => {
  res.json({
    virtual_bulb: "http://localhost:" + port + "/client/bulb",
    td_bulb: "http://localhost:" + port + "/bulb",
  });
});
// ---------------------------------------- //
server.listen(port);
