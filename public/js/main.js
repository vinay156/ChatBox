const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const imageform = document.getElementById("image-form");

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();
const socketConnect = io.connect();
var uploader = new SocketIOFileUpload(socketConnect);

// Join chatroom
socket.emit("joinRoom", { username, room });

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  outputMessage(message);
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

//Image from server
socket.on("user-file-data", ({ msg, msgfile }) => {
  // console.log("name of user " + msg.user);
  outputImage(msg, msgfile);
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // Get message text
  const msg = e.target.elements.msg.value;
  // Emit message to server
  socket.emit("chatMessage", msg);
  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

//image submit
const $image_send_btn = document.getElementById("image-send-button");
const $image_input = document.getElementById("image-input");

uploader.listenOnSubmit($image_send_btn, $image_input);

// socket.on('upload.progress')
socketConnect.on("uploader", ({ percentage }, callback) => {
  console.log(percentage);

  if (percentage == 100) {
    var data = $image_input.files[0];
    var reader = new FileReader();
    reader.onload = function () {
      var msg = {};
      msg.file = reader.result;
      msg.fileName = data.name;
      console.log(msg);
      socket.emit("user-file", msg);
    };
    reader.readAsDataURL(data);
  }
  callback("LOL");
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

// Output image to DOM
function outputImage(msg, msgfile) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${msg.username} <span>${msg.time}</span></p>
  <div >
  <a href=${msgfile} download><embed src="${msgfile}" href=${msgfile}  type="application/pdf" width="100%" height="300px"/></a>
  </div>`;
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users.map((user) => `<li>${user.username}</li>`).join("")}
  `;
}
