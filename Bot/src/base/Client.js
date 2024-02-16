const {Client} = require('discord.js');
const {readdirSync} = require('fs')
const {join} = require('path')


module.exports = class extends Client{
    constructor(db, options){
        super(options)

        this.commands = []
        this.selectMenus = []
        this.loadCmd()
        this.loadEvent()
        this.loadSelects()
        this.db = db
    }

    setCommands(){
        this.guilds.cache.map(guild => guild.commands.set(this.commands))
    }

    loadCmd(){
        let path = 'src/commands'
        let files = readdirSync(path)

        for(const file of files){
            let command = require(join(process.cwd(),`${path}/${file}`))
            let cmd = new (command)(this, )
            this.commands.push(cmd)
        }
    }

    loadEvent(){
        let path = 'src/events'
        let files = readdirSync(path)

        for(const file of files){
            let event = require(join(process.cwd(), `${path}/${file}`))
            let evt = new (event)(this)
            this.on(evt.name, evt.run)
        }
    }

    loadSelects(){
        let path = 'src/selectMenus'
        let files = readdirSync(path)

        for(const file of files){
            let event = require(join(process.cwd(), `${path}/${file}`))
            let evt = new (event)(this)
            this.selectMenus.push(evt)
        }
    }
}