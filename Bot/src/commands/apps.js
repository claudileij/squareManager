const Command =  require('../base/Command')
const Discord = require('discord.js')
const {ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder} = require('discord.js')
const {SquareCloudAPI} = require('@squarecloud/api')
const crypto = require('crypto')


/*
Exportando um extends da classe Command, para ser carregado no loadCmd do ../base/Client.js
*/
module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "apps",
            description: "View your apps"
        });
    }

    run = async (interaction) => {
        let db = this.client.db.API // Atalho pra acessar a db, posteriormente definida na classe Client
        let db_user = await db.findOne({where: {userid: interaction.user.id}}); // Procurando se um usuário já está no banco de dados pelo userid
        if(!db_user){return interaction.reply({content: "```\n🤨 Você ainda não tem uma API_KEY registrada, use o comando /register para se registrar\n```", ephemeral: true})} //Caso o usuário não seja encontrado (!db_user), irá retornar.


        let square = new SquareCloudAPI(db_user.api_key)
        try{
            let user = await square.users.get();
            let md5mail = crypto.createHash('md5').update(user.email).digest('hex'); //Convertendo o email do usuário em md5 para procurar pelo perfil no gravatar

            let apps = user.applications // Todas as aplicações do usuário square
            let models = []
            var running = 0

            /*Definindo variáveis, e caso uma das opções sejam udefined, irá ser convertido para outro valor*/
            var ramUsed = user.plan.used != undefined ? user.plan.used : 0
            var ramLimit = user.plan.limit != undefined ? user.plan.limit : 0
            var expireIn = user.plan.expiresIn != undefined ? `<t:${user.plan.expiresIn}:R>` : "`Permanent`"
            /*                     */

            if(apps.size == 0){models.push({label: "Nenhum app", description: "Faça o upload do seu app no site da square", emoji: '🔎', value: 'semapps'})} // Caso o usuário não tenha nenhum app, irá criar um item no select menu, informando que o usuário não tem aplicações.


            /* Incluindo todas as aplicações na variável model, para depois ser carregada em  StringSelectMenuBuilder.addOptions*/
            apps.map(async (app) => {
                var status = await app.getStatus();
                if(status.running){running++}
                models.push({label: app.tag,description: app.description,emoji: '920499646562992159',value: app.id})
            })

            /*                                    */


            /* Embed com as informações do usuário, utilizando as variáveis estilizadas */
            let embed = new EmbedBuilder()
            .setTitle("Painel de aplicações")
            .setAuthor({name: user.tag, iconURL: `https://0.gravatar.com/avatar/${md5mail}?size=256`, url: "https://squarecloud.app"})
            .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')
            .setDescription('\n**Plano**: `'+user.plan.name+'`\n**Consumo (RAM)**: `'+ramUsed+'/'+ramLimit+'`\n**Expira**: '+expireIn)
            .addFields(
                {name: "Aplicações totais", value: '`'+String(user.applications.size)+"`", inline: true},
                {name: "Aplicações ativas", value: '`'+String(running)+'`', inline: true}
            )
            /*                                                                         */


            /* Select Menu, que irá coletar todas as aplicações do models e transforma-lo em uma option*/
            let select = new StringSelectMenuBuilder()
            .setCustomId('selectapps')
            .setPlaceholder('Seus apps')
            .addOptions(
                models.map(obj => new StringSelectMenuOptionBuilder()
                .setLabel(obj.label)
                .setDescription(obj.description)
                .setEmoji(obj.emoji)
                .setValue(obj.value)
                )
            )

            /*                                      */



            /* Adicionando select menu ao ActionRow */
            let row = new ActionRowBuilder()
            .addComponents(select)

            
            await interaction.reply({embeds: [embed], components: [row], ephemeral: true})
        }
        catch(error){
            console.log(error)
            return interaction.reply({content: '```\n😞 Houve um erro, verifique se sua api_key é valida: '+error.message+"\n```", ephemeral: true})
        }
        
        
        
    
    }
}