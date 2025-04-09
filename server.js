const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const players = {};

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("new-player", (username) => {
    const newPlayer = {
      x: 400,
      y: 300,
      username,
    };
  
    // Add the new player to the list
    players[socket.id] = newPlayer;
  
    // Send all current players to the new user
    socket.emit("players", players);
  
    // Notify all existing users about the new player
    socket.broadcast.emit("update-player", socket.id, newPlayer);
  });
  
  

//   socket.on("move", (position) => {
//     if (players[socket.id]) {
//       players[socket.id].x = position.x;
//       players[socket.id].y = position.y;
//       socket.broadcast.emit("update-player", socket.id, position);
//     }
//   });
socket.on("move", (position) => {
    if (players[socket.id]) {
      players[socket.id].x = position.x;
      players[socket.id].y = position.y;
  
      // Send updated position to ALL players (including the sender)
      io.emit("update-player", socket.id, position);
    }
  });
  

  socket.on("chat-message", (msg) => {
    io.emit("chat-message", { id: socket.id, message: msg });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete players[socket.id];
    io.emit("remove-player", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
