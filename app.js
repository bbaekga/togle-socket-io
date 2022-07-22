const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const socketIO = require('socket.io')
const moment = require('moment')
const request = require('request')

const {dateTimeFormat, WaitingRoom} = require('./waiting-room')
const {Player} = require('./player')

const io = socketIO(server, {
  allowEIO3: true
})
const port = process.env.PORT || 3001

server.listen(port, () => {
  logger(`Socket IO server listening on port ${port}`)
})

app.get('/', (request, response) => {
  response.send('Wake Up!!!')
  logger('Wake Up!!!')
})

setInterval(() => {
  request({
    url: `https://togle-socket-io.heroku.com`,
    method: 'GET'
  })
}, 6000 * 60 * 10)

function logger(message, data = null) {
  if (data) {
    console.log(`[${moment().format(dateTimeFormat)}] ${message}`, data)
  } else {
    console.log(`[${moment().format(dateTimeFormat)}] ${message}`)
  }
}

let waitingRoomList = []
let playerList = []

const waitingRooms = io.of('/waiting-room')
waitingRooms.on('connection', socket => {

  broadCastWaitingRoom()
  socket.on('join-waiting-room', data => joinWaitingRoom(data, socket))
  socket.on('create-room', createRoom)
  socket.on('leave-room', leaveRoom)
  socket.on('enter-room', enterRoom)

  socket.on('disconnect', () => {
    const player = playerList.find(p => p.socketId === socket.id)
    playerList = playerList.filter(p => p.socketId !== socket.id)
    logger(`Player leave waiting room...`, player)
  })
})

function broadCastWaitingRoom() {
  waitingRooms.emit('waiting-room-list', {waitingRoomList: waitingRoomList})
}

function joinWaitingRoom(data, socket) {
  playerList.push(new Player(Object.assign({}, data, {socketId: socket.id})))
  logger(`Player waiting room entered : ${socket.id}`, data)
}

function createRoom(data) {
  logger('Room created...', data)
  waitingRoomList.push(new WaitingRoom(data))
  broadCastWaitingRoom()
}

function leaveRoom(data) {
  const {roomId, playerId} = data
  logger('Player leave a room...', data)
  const room = waitingRoomList.find(r => r.id === roomId)
  if (room) {
    room.leave(playerId)
    if (room.isEmptyRoom) {
      waitingRoomList = waitingRoomList.filter(r => r.id !== roomId)
    }
  }
  broadCastWaitingRoom()
}

function enterRoom(data) {
  const {roomId, player} = data
  logger('Player enter a room...', data)
  waitingRoomList.forEach(room => {
    if (room.id === roomId) {
      room.enter(player)
    }
  })
  broadCastWaitingRoom()
}

