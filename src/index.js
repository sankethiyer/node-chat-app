const express = require('express');
const path = require('path');
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { getUser, getUsersInRoom, removeUser, addUser } = require("./utils/users")

const app = express();
const server = http.createServer(app);
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('Socket connection...');

    socket.on('sendMessage', (msg, callback) => {
        var filter = new Filter();
        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!')
        }
        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, msg));
        callback()
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, coords));
        callback()
    });
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage("Admin", 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users : getUsersInRoom(user.room)
        })
        callback()
    })
});

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})