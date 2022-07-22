class Player {
  constructor(data) {
    this.socketId = data?.socketId || null
    this.id = data?.id || null
    this.name = data?.name || null
  }
}

module.exports = {
  Player
}
