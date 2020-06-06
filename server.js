const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
var siofu = require("socketio-file-upload");
var FormData = require('form-data');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");


var s = new FormData();

// Express Server
const app = express();
app.use(siofu.router);
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }, callback) => {
    const { error, user } = userJoin(socket.id, username, room);
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //Uploader Information
  var uploader = new siofu();
  uploader.listen(socket);
  uploader.on("progress", function (event) {
    socket.emit(
      "uploader",
      {
        percentage: (event.file.bytesLoaded / event.file.size) * 100,
      },
      (message) => {
        console.log(message);
      }
    );
  });

  //Send image
  socket.on("user-file", function (msg) {
    file = msg.file,
    newFileName = msg.fileName
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("user-file-data", {
      msg: formatMessage(user.username, msg.fileName),
      msgfile: msg.file,
      fileType: msg.fileType,
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    console.log("chat message");

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server Running on port ${PORT}`));
