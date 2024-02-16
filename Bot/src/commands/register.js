const Command =  require('../base/Command')
const Discord = require('discord.js')

/*
Exportando um extends da classe Command, para ser carregado no loadCmd do ../base/Client.js
*/
module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "register",
            description: "Register API_KEY",
            options: [
                {
                    type: 3,
                    name: "api_key",
                    description: 'The squarecloud api key',
                    required: true
                }
            ]
        });
    }

    run = async (interaction) => {
        let db = this.client.db.API // Atalho pra acessar a db, posteriormente definida na classe Client
        let api_key = interaction.options.getString('api_key'); // Obtendo o valor passado pelo usuário, no slash command
        let user = await db.findOne({where: {userid: interaction.user.id}}); // Procurando se um usuário já está no banco de dados pelo userid

        /* Caso o usuário não estiver registrado no banco de dados, então ele o registrará com as informações necessárias*/
        if(!user){
            try{
                await db.create({
                    username: interaction.user.username,
                    userid: interaction.user.id,
                    api_key: api_key
                })
                return interaction.reply({content: "```\nAPI_KEY registrado com sucesso, comece usando /apps para ver suas aplicações 😉\n```", ephemeral: true})
            } catch(error){
                return interaction.reply({content: '```\n😞 Houve um erro ao te registrar: '+error.name+"\n```", ephemeral: true})
            }
        }else{ // Caso o usuário já esteja no banco de dados, apenas atualizará o api_key
            try{
                user.api_key = api_key;
            user.save()
            return interaction.reply({content: '```\nAPI_KEY atualizado com sucesso, você pode continuar a usar /apps 😉\n```', ephemeral: true})
            } catch(error){
                return interaction.reply({content: `Houve um erro ao atualizar: ${error.name}`, ephemeral: true})
            }
            

        }


    }
}