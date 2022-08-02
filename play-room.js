const moment = require('moment')
const {Player} = require('./player')
const uuid = require('uuid')
const {logger} = require("./utils");
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'

const choiceSetter = {
  'scissors-scissors': false,
  'scissors-stone': false,
  'scissors-paper': true,
  'stone-scissors': true,
  'stone-stone': false,
  'stone-paper': false,
  'paper-scissors': false,
  'paper-stone': true,
  'paper-paper': false,
}

class PlayRoom {
  constructor(data) {
    this.id = uuid.v4()
    this.roomName = data?.roomName || null
    this.player1 = data?.player1 ? data.player1 : new Player()
    this.player2 = data?.player2 ? data.player2 : new Player()
    this.createdAt = moment().format(dateTimeFormat)
    this.startedAt = null
  }

  get isEmptyRoom() {
    return !this.player1.id && !this.player2.id
  }

  get choiceCompleted() {
    return !!this.player1.choice && !!this.player2.choice
  }

  enter(player) {
    player.enterRoom(this.id)
    if (this.player1.id && this.player1.id !== player.id) {
      this.player2 = player
    } else if (this.player2.id && this.player2.id !== player.id) {
      this.player1 = player
    }

    if (this.player1.id && this.player2.id) {
      this.startedAt = moment().format(dateTimeFormat)
    }

    logger('Player enter a room...', player, this)
  }

  leave(playerId) {
    if (this.player1.id === playerId) {
      this.player1 = this.player2
      this.player2 = new Player()
    } else if (this.player2.id === playerId) {
      this.player2 = new Player()
    } else {
      this.player1 = new Player()
      this.player2 = new Player()
    }
    this.startedAt = null
    this.player1.initStone()
    this.player2.initStone()

    if (this.isEmptyRoom) {
      RoomManager.remove(this.id)
    }
  }

  chooseTurn(data, socketId) {
    if (this.player1.socketId === socketId) {
      this.player1.choice = data
    } else if (this.player2.socketId === socketId) {
      this.player2.choice = data
    }
  }

  initStones() {
    this.player1.initStone()
    this.player2.initStone()
  }

  setStone() {
    const player1Choice = this.player1.choice
    const player2Choice = this.player2.choice
    if (player1Choice === player2Choice) {
      this.initStones()
      return
    }
    if (choiceSetter[`${player1Choice}-${player2Choice}`]) {
      this.player1.setBlack()
    } else {
      this.player1.setWhite()
    }
    if (choiceSetter[`${player2Choice}-${player1Choice}`]) {
      this.player2.setBlack()
    } else {
      this.player2.setWhite()
    }
  }
}

module.exports = {
  PlayRoom,
}
