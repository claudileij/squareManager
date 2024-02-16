const Event = require('../base/Event')

/* Exportando um extends da classe Event */
module.exports = class extends Event{
    constructor(client){
        super(client, {
            name: "interactionCreate"
        })
    }

    run = async (interaction) => {


        /* Se a interação for um comando, ele irá procurar na lista de comandos carregados pelo Client, e caso o nome do comando da interação for igual ao comando carregado, ele irá iniciar o mesmo passando a interação */
        if(interaction.isCommand()){
            let cmd = this.client.commands.find(c => c.name === interaction.commandName)
            if(cmd){cmd.run(interaction)}
        }


        /* Se a interação for um Select Menu, ele irá procurar na lista de select menu carregados pelo Client, e caso os nomes definidos forem iguais, irá iniciar o mesmo passando a interação */
        if(interaction.isStringSelectMenu()){
            let slct = this.client.selectMenus.find(s => s.name == interaction.customId)
            if(slct){slct.run(interaction)}
        }

        /* Se for um botão, ele fará o client emitir novamente o evento, porém com o customId do botão */
        if(interaction.isButton()){
            this.client.emit(interaction.customId, interaction)
        }

        
    }
}