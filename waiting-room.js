const moment = require('moment')
const {Player} = require('./player')
const uuid = require('uuid')
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'

class WaitingRoom {
  constructor(data) {
    this.id = uuid.v4()
    this.roomName = data?.roomName || null
    this.player1 = new Player(data?.player1)
    this.player2 = new Player(data?.player2)
    this.createdAt = moment().format(dateTimeFormat)
    this.startedAt = null
  }

  get isEmptyRoom() {
    return !this.player1.id && !this.player2.id
  }

  enter(player) {
    if (this.player1.id && this.player1.id !== player.id) {
      this.player2 = new Player(player)
    } else if (this.player2.id && this.player2.id !== player.id) {
      this.player1 = new Player(player)
    }

    if (this.player1.id && this.player2.id) {
      this.startedAt = moment().format(dateTimeFormat)
    }

    console.log(this)
  }

  leave(playerId) {
    if (this.player1.id === playerId) {
      this.player1 = new Player(this.player2)
      this.player2 = new Player()
    } else if (this.player2.id === playerId) {
      this.player2 = new Player()
    }
    this.startedAt = null
  }
}

module.exports = {
  dateTimeFormat,
  WaitingRoom,
}
