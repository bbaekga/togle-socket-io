const {Player} = require("./player")

class PlayerManager {
  constructor() {
    this.playerList = []
  }

  getAll() {
    return this.playerList
  }

  add(data) {
    const player = new Player(data)
    this.playerList.push(player)
    return player
  }

  get({playerId = null, socketId = null}) {
    if (playerId) {
      return this.playerList.find(player => player.id === playerId)
    }
    if (socketId) {
      return this.playerList.find(player => player.socketId === socketId)
    }
    return null
  }

  remove({playerId = null, socketId = null}) {
    if (playerId) {
      this.playerList = this.playerList.filter(player => player.id !== playerId)
    } else if (socketId) {
      this.playerList = this.playerList.filter(player => player.socketId !== socketId)
    }
  }
}

module.exports = PlayerManager
