const {PlayRoom} = require("./play-room")

class PlayRoomManager {
  constructor() {
    this.roomList = []
  }

  getAll() {
    return this.roomList
  }

  add(data) {
    const room = new PlayRoom(data)
    this.roomList.push(room)
    return room
  }

  get(roomId) {
    return this.roomList.find(room => room.id === roomId)
  }

  remove(roomId) {
    this.roomList = this.roomList.filter(room => room.id !== roomId)
    return this.roomList
  }

  enter(roomId, player) {
    const room = this.get(roomId)
    room.enter(player)
  }
}

module.exports = PlayRoomManager
