const { Client } = require('discord.js');
const { readdirSync } = require('fs')
const { join } = require('path')


/* Exportando o extends da classe Client do discord.js */
module.exports = class extends Client {
    constructor(db, options) {
        super(options)

        /* Definindo variáveis e carregando componentes */
        this.commands = []
        this.selectMenus = []
        this.loadCmd()
        this.loadEvent()
        this.loadSelects()
        this.db = db
    }

    setCommands() {
        this.guilds.cache.map(guild => guild.commands.set(this.commands))
    }

    loadCmd() {
        const path = 'src/commands'
        const files = readdirSync(path)

        for (const file of files) {
            const command = require(join(process.cwd(), `${path}/${file}`))
            const cmd = new (command)(this,)
            this.commands.push(cmd)
        }
    }

    loadEvent() {
        const path = 'src/events'
        const files = readdirSync(path)

        for (const file of files) {
            const event = require(join(process.cwd(), `${path}/${file}`))
            const evt = new (event)(this)
            this.on(evt.name, evt.run)
        }
    }

    loadSelects() {
        const path = 'src/selectMenus'
        const files = readdirSync(path)

        for (const file of files) {
            const event = require(join(process.cwd(), `${path}/${file}`))
            const evt = new (event)(this)
            this.selectMenus.push(evt)
        }
    }
}