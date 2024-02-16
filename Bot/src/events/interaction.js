const Event = require('../base/Event')

module.exports = class extends Event{
    constructor(client){
        super(client, {
            name: "interactionCreate"
        })
    }

    run = async (interaction) => {

        if(interaction.isCommand()){
            let cmd = this.client.commands.find(c => c.name === interaction.commandName)
            if(cmd){cmd.run(interaction)}
        }

        if(interaction.isStringSelectMenu()){
            let slct = this.client.selectMenus.find(s => s.name == interaction.customId)
            if(slct){slct.run(interaction)}
        }

        if(interaction.isButton()){
            this.client.emit(interaction.customId, interaction)
        }

        
    }
}