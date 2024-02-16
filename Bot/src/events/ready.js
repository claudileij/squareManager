const Event = require('../base/Event')

module.exports = class extends Event{
    constructor(client){
        super(client, {
            name: "ready"
        })
    }

    run = async () => {
        console.log(`[${this.client.user.tag}] Logged!`)
        this.client.setCommands()
    }
}