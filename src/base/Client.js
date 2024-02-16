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
        this.db = db

        this.loadSlashCommands()
        this.loadEvents()
        this.loadSelects()
        
    }

    setCommands() {
        this.guilds.cache.map(guild => guild.commands.set(this.commands))
    }

    loadSlashCommands() {
        const path = 'src/commands'
        const files = readdirSync(path)

        for (const file of files) {
            const commandClass = require(join(process.cwd(), `${path}/${file}`))
            const commandHandler = new (commandClass)(this,)
            this.commands.push(commandHandler)
        }
    }

    loadEvents() {
        const path = 'src/events'
        const files = readdirSync(path)

        for (const file of files) {
            const eventClass = require(join(process.cwd(), `${path}/${file}`))
            const eventHandler = new (eventClass)(this)
            this.on(eventHandler.name, eventHandler.run)
        }
    }

    loadSelects() {
        const path = 'src/selectMenus'
        const files = readdirSync(path)

        for (const file of files) {
            const selectClass = require(join(process.cwd(), `${path}/${file}`))
            const selectHandler = new (selectClass)(this)
            this.selectMenus.push(selectHandler)
        }
    }
}