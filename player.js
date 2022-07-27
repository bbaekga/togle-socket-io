class Player {
  constructor(data) {
    this.socketId = data?.socketId || null
    this.roomId = data?.roomId || null
    this.id = data?.id || null
    this.name = data?.name || null
    this.choice = data?.choice || null
    this.black = false
    this.white = false
  }

  enterRoom(roomId) {
    this.roomId = roomId
  }

  leaveRoom() {
    this.roomId = null
    this.choice = null
    this.black = false
    this.white = false
  }

  initStone() {
    this.black = false
    this.white = false
    this.choice = null
  }

  setBlack() {
    this.white = false
    this.black = true
  }

  setWhite() {
    this.black = false
    this.white = true
  }
}

module.exports = {
  Player,
}
