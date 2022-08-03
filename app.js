const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const socketIO = require('socket.io')
const request = require('request')

const roomManager = require('./play-room-manager')
global.RoomManager = new roomManager()
const playerManager = require('./player-manager')
global.PlayerManager = new playerManager()
const {logger} = require('./utils')

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
    url: 'https://togle-socket-io.herokuapp.com',
    method: 'GET'
  })
}, 1000 * 60 * 10)

const fiveStoneIO = io.of('/five-stone')
fiveStoneIO.on('connection', socket => {
  broadCastWaitingRoom()
  socket.on('join-waiting-room', data => joinWaitingRoom(data, socket))
  socket.on('create-room', data => createRoom(data, socket))
  socket.on('leave-room', data => leaveRoom(data, socket))
  socket.on('enter-room', data => enterRoom(data, socket))

  socket.on('choose-turn', data => chooseTurn(data, socket))
  socket.on('fight', () => gameStart(socket))
  socket.on('put-on-stone', data => putOnStone(data, socket))
  socket.on('give-up', () => giveUp(socket))
  socket.on('score-updated', () => {
    fiveStoneIO.emit('score-updated')
  })

  socket.on('chat', data => chat(data, socket))
  socket.on('typing-start', () => typingStart(socket))
  socket.on('typing-end', () => typingEnd(socket))
  socket.on('get-chat-messages', () => getChatMessage(socket))
  socket.on('disconnect', () => {
    const player = PlayerManager.get({socketId: socket.id})
    PlayerManager.remove({socketId: socket.id})
    if (player && player.roomId) {
      leaveRoom({roomId: player.roomId}, socket)
    }
    logger(`Player leave waiting room...`, player?.name)
  })
})

function broadCastWaitingRoom() {
  fiveStoneIO.emit('play-room-list', {playRoomList: RoomManager.getAll()})
}

function joinWaitingRoom(data, socket) {
  PlayerManager.add(Object.assign({}, data, {socketId: socket.id}))
  const player = PlayerManager.get({socketId: socket.id})
  logger(`Player waiting room entered...`, player?.name)
  logger('All Players', PlayerManager.getAll().map(p => p.name))
}

function createRoom(data, socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.add({
    roomName: data,
    player1: player,
  })
  player.enterRoom(room.id)
  socket.join(room.id)
  broadCastWaitingRoom()
  logger('Room created...', `${room?.roomName} : ${player.name}`)
}

function leaveRoom(data, socket) {
  const {roomId} = data
  const player = PlayerManager.get({socketId: socket.id})
  if (player) {
    player.leaveRoom()
  }
  const room = RoomManager.get(roomId)
  if (room) {
    room.leave(player?.id)
  }
  logger('Player leave a room...', `${room?.roomName} : ${player?.name ?? ''}`)
  broadCastWaitingRoom()
}

function enterRoom(data, socket) {
  const {roomId} = data
  const player = PlayerManager.get({socketId: socket.id})
  RoomManager.enter(roomId, player)
  socket.join(roomId)
  broadCastWaitingRoom()
  const room = RoomManager.get(roomId)
  logger('Player join the room...', `${room?.roomName} : ${player?.name}`)
}

function chooseTurn(data, socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  room.chooseTurn(data, socket.id)
  if (room.choiceCompleted) {
    const result = {
      player1: {
        id: room.player1.id,
        choice: room.player1.choice
      },
      player2: {
        id: room.player2.id,
        choice: room.player2.choice
      }
    }
    fiveStoneIO.to(room.id).emit('choose-turn-result', result)
    room.setStone()
    fiveStoneIO.to(room.id).emit('play-room-updated', RoomManager.get(room.id))
  }
  const _room = RoomManager.get(player.roomId)
  logger('choose-turn', `${_room.player1.name} : ${_room.player1.choice} | ${_room.player2.name} : ${_room.player2.choice}`)
}

function gameStart(socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  room.player1.choice = null
  room.player2.choice = null
  fiveStoneIO.to(player.roomId).emit('game-start')
  logger('Game start...', `${room?.roomName} : ${room.player1.name} vs ${room.player2.name}`)
}

function putOnStone(data, socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  let targetId = player.id === room?.player1?.id ? room?.player2?.socketId : room?.player1?.socketId
  if (targetId) {
    fiveStoneIO.to(targetId).emit('stone-placed', data)
    logger('Player put on stone...', `${player?.name} row : ${data.row} column : ${data.column} color : ${data.color}`)
  }
}

function giveUp(socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  let targetId = player.id === room?.player1?.id ? room?.player2?.socketId : room?.player1?.socketId
  if (targetId) {
    fiveStoneIO.to(targetId).emit('rival-give-up')
    logger('Player give up game...', `${room.roomName} : ${player.name}`)
  }
}

function chat(data, socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  room.chatMessage({
    text: data,
    playerId: player.id
  })
  let targetId = player.id === room?.player1?.id ? room?.player2?.socketId : room?.player1?.socketId
  if (targetId) {
    fiveStoneIO.to(targetId).emit('chat-message', data)
  }
}

function typingStart(socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  let targetId = player.id === room?.player1?.id ? room?.player2?.socketId : room?.player1?.socketId
  if (targetId) {
    fiveStoneIO.to(targetId).emit('rival-typing-start')
  }
}

function typingEnd(socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  let targetId = player.id === room?.player1?.id ? room?.player2?.socketId : room?.player1?.socketId
  if (targetId) {
    fiveStoneIO.to(targetId).emit('rival-typing-end')
  }
}

function getChatMessage(socket) {
  const player = PlayerManager.get({socketId: socket.id})
  const room = RoomManager.get(player.roomId)
  socket.emit('chat-messages', room.chatMessages)
}
