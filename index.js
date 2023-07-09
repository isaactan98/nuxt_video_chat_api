const express = require('express');
const app = express();
const server = require('http').Server(app)
const { v4: uuidv4 } = require("uuid")

const PORT = process.env.PORT || 4000;

const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
})

const { ExpressPeerServer } = require("peer")
const peerServer = ExpressPeerServer(server, {
    debug: true
})

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use("/peerjs", peerServer)

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.post("/loading", (req, res) => {
    res.status(200).send("Good")
})

var uuid_value = null;
app.post('/get_uuid', (req, res) => {
    uuid_value = uuidv4()
    res.send(uuid_value);
})

io.on("connection", (socket) => {

    socket.on("join-room", (roomId, userId, userName) => {
        console.log("user connected : " + userName, "room ID: " + roomId, " peer ID: " + userId);
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId, userName);
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
        socket.on('disconnect', () => {
            console.log("user disconnected : " + userName);
            socket.to(roomId).emit('user-disconnected', userId, userName)
        })
    });
})

var i = 0;
setInterval(() => {
    i++
    io.emit("tick", i)
}, 1000)

server.listen(PORT, () => {
    console.log("Server is running : " + PORT)
})