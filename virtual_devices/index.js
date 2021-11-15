"use strict";
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cookie: false });
const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/static", express.static("public"));
app.use("static/bulb", express.static("public/bulb"));
const mirobot = require("./src/mirobot")(io);
const bulb = require("./src/bulb")(io);
app.use(bulb);
app.use(mirobot);

// ---------------------------------------- //

http.listen(3001, () => console.log(`Listening on port ${3001}`));
