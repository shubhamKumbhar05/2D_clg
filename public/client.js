const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// const subAreas = [
//     {
//       name: "Math",
//       x: 50, y: 50, width: 200, height: 150,
//       entry: { x: 130, y: 200, width: 40, height: 10 },
//       exit: { x: 130, y: 40, width: 40, height: 10 }
//     },
//     {
//       name: "Science",
//       x: 300, y: 50, width: 200, height: 150,
//       entry: { x: 380, y: 200, width: 40, height: 10 },
//       exit: { x: 380, y: 40, width: 40, height: 10 }
//     },
//     {
//       name: "English",
//       x: 550, y: 50, width: 200, height: 150,
//       entry: { x: 630, y: 200, width: 40, height: 10 },
//       exit: { x: 630, y: 40, width: 40, height: 10 }
//     }
//   ];
  
  
//   function isInsideBox(x, y, box) {
//     return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
//   }
  

let socket;
let username;
let players = {};
let keys = {};
let lastEmitTime = 0;
let mobileDir = { up: false, down: false, left: false, right: false };

// Chat
let chatInput = document.getElementById("chatInput");
let sendBtn = document.getElementById("sendBtn");

function join() {
  username = document.getElementById("username").value.trim();
  if (!username) return alert("Please enter your name");

  document.getElementById("login").style.display = "none";
  document.getElementById("mobile-controls").style.display = "flex";
  document.getElementById("chatBox").style.display = "flex";
  canvas.style.display = "block";

  socket = io();

  socket.emit("new-player", username);

  socket.on("players", (data) => {
    players = { ...players, ...data };
  });
  

//   socket.on("update-player", (id, position) => {
//     if (players[id]) {
//       players[id].x = position.x;
//       players[id].y = position.y;
//     }
//   });

    // socket.on("update-player", (id, position) => {
    //     if (!players[id]) {
    //     players[id] = position;
    //     }
    // });

    socket.on("update-player", (id, position) => {
        if (!players[id]) {
          players[id] = position;
        } else {
          players[id].x = position.x;
          players[id].y = position.y;
        }
      });
      
  

  socket.on("remove-player", (id) => {
    delete players[id];
  });

  socket.on("chat-message", ({ id, message }) => {
    if (players[id]) {
      players[id].chat = message;
      setTimeout(() => {
        if (players[id]) delete players[id].chat;
      }, 3000);
    }
  });

  document.addEventListener("keydown", (e) => keys[e.key] = true);
  document.addEventListener("keyup", (e) => keys[e.key] = false);

  gameLoop();
}

function updatePosition() {
    const player = players[socket.id];
    if (!player) return;
  
    let moved = false;
    const speed = 2;
    const size = 30;
    let newX = player.x;
    let newY = player.y;
  
    if (keys["ArrowUp"] || mobileDir.up) newY -= speed;
    if (keys["ArrowDown"] || mobileDir.down) newY += speed;
    if (keys["ArrowLeft"] || mobileDir.left) newX -= speed;
    if (keys["ArrowRight"] || mobileDir.right) newX += speed;
  
    // Boundary enforcement (game box)
    if (newX < 0 || newX + size > canvas.width || newY < 0 || newY + size > canvas.height) return;
  
    // Subject area enforcement
    if (!isBlocked(newX, newY, player.x, player.y)) {
      player.x = newX;
      player.y = newY;
      moved = true;
    }
  
    const now = Date.now();
    if (moved && now - lastEmitTime > 50) {
      lastEmitTime = now;
      socket.emit("move", { x: player.x, y: player.y });
    }
  }
  
  
  

  function drawSubjects() {
    const subjects = [
      {
        name: "Math",
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        entry: { x: 120, y: 200, width: 60, height: 10 },
        exit: { x: 120, y: 40, width: 60, height: 10 },
        color: "#f0f8ff"
      },
      {
        name: "Science",
        x: 300,
        y: 50,
        width: 200,
        height: 150,
        entry: { x: 370, y: 200, width: 60, height: 10 },
        exit: { x: 370, y: 40, width: 60, height: 10 },
        color: "#e6ffe6"
      },
      {
        name: "English",
        x: 550,
        y: 50,
        width: 200,
        height: 150,
        entry: { x: 620, y: 200, width: 60, height: 10 },
        exit: { x: 620, y: 40, width: 60, height: 10 },
        color: "#fff5cc"
      }
    ];
  
    for (let subject of subjects) {
      // Subject area
      ctx.fillStyle = subject.color;
      ctx.fillRect(subject.x, subject.y, subject.width, subject.height);
  
      // Labels
      ctx.fillStyle = "black";
      ctx.fillText(subject.name, subject.x + subject.width / 2, subject.y - 10);
  
      // Entry
      ctx.fillStyle = "green";
      ctx.fillRect(subject.entry.x, subject.entry.y, subject.entry.width, subject.entry.height);
  
      // Exit
      ctx.fillStyle = "red";
      ctx.fillRect(subject.exit.x, subject.exit.y, subject.exit.width, subject.exit.height);
    }
  
    // Save for boundary checks
    window.subjects = subjects;
  }

  function isInsideRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }
  
  function isBlocked(x, y, px, py) {
    for (let subject of window.subjects) {
      const inside = isInsideRect(x + 15, y + 15, subject);
      const wasInside = isInsideRect(px + 15, py + 15, subject);
      const atEntry = isInsideRect(x + 15, y + 15, subject.entry);
      const atExit = isInsideRect(x + 15, y + 15, subject.exit);
  
      if (!inside && wasInside && !atExit) return true;  // Trying to exit not through exit
      if (inside && !wasInside && !atEntry) return true; // Trying to enter not through entry
    }
    return false;
  }
  
  
  
  

function gameLoop() {
  updatePosition();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSubjects();

  for (let id in players) {
    const p = players[id];
    ctx.beginPath();
    ctx.fillStyle = id === socket.id ? "#2196f3" : "#4caf50";
    ctx.arc(p.x + 15, p.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.username, p.x + 15, p.y - 5);

    if (p.chat) {
      ctx.fillStyle = "#ffffffcc";
      ctx.fillRect(p.x - 10, p.y - 30, p.chat.length * 7, 20);
      ctx.strokeRect(p.x - 10, p.y - 30, p.chat.length * 7, 20);
      ctx.fillStyle = "black";
      ctx.fillText(p.chat, p.x + 15, p.y - 15);
    }
  }

  requestAnimationFrame(gameLoop);
}

// Chat system
sendBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit("chat-message", msg);
    chatInput.value = "";
  }
};
