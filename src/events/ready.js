const Event = require('../base/Event')

module.exports = class extends Event {
    constructor(client) {
        super(client, {
            name: "ready"
        })
    }

    run = async () => {
        console.log(`[${this.client.user.tag}] Logged!`)
        this.client.setCommands() // Quando o bot for iniciado, ele irá carregar a função do Client que define os comandos do bot nos servidores (guilds).
    }
}