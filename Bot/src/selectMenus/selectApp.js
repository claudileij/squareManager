const Select = require('../base/Select')
const wait = require('node:timers/promises').setTimeout;
const {SquareCloudAPI} = require('@squarecloud/api')
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ComponentType } = require('discord.js')

module.exports = class extends Select{
    constructor(client){
        super(client, {
            name: 'selectapps'
        })
    }

    run = async (interaction) => {
        let appid = interaction.values[0]
        if(appid == "semapps"){return interaction.reply({content: "Você não tem aplicações, faça o upload no site da square: https://squarecloud.app", ephemeral: true})}
        
        let db = this.client.db.API
        let db_user = await db.findOne({where: {userid: interaction.user.id}});
        let square = new SquareCloudAPI(db_user.api_key)
        let user = await square.users.get();
        let app = await user.applications.get(appid);


        let updateEmbed = async () => {
            let appStatus = await app.getStatus();
            let appLogs = await app.getLogs();

            const buttonStart = new ButtonBuilder().setCustomId('startapp').setLabel('Start').setStyle(ButtonStyle.Success)
            .setDisabled(appStatus.running)
            const buttonStop = new ButtonBuilder().setCustomId('stopapp').setLabel('Stop').setStyle(ButtonStyle.Danger)
            .setDisabled(appStatus.running == false)
            const buttonRestart = new ButtonBuilder().setCustomId('restartapp').setLabel('Restart').setStyle(ButtonStyle.Primary);
            let row = new ActionRowBuilder().addComponents(buttonStart, buttonStop, buttonRestart)

            let stats = appStatus.status == 'running' ? '```diff\n+ running \n```' : '```diff\n- exited \n```'
            let embed = new EmbedBuilder()
            .setTitle(app.tag)
            .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')
            .addFields(
                {name: "CPU", value: '`'+appStatus.usage.cpu+'`' , inline: true},
                {name: "RAM", value: '`'+appStatus.usage.ram+'`', inline: true},
                {name: 'STORAGE', value: '`'+appStatus.usage.storage+'`', inline: true},
                {name: "STATUS", value: stats, inline: true},
                {name: 'LOGS', value: '```bash\n'+appLogs.slice(-200)+'\n```', inline: false}
            )

            return [embed, row]

        }

        
        let data = await updateEmbed()
        await interaction.reply({embeds: [data[0]], components: [data[1]], ephemeral: true})
        var isCollecting = true

        this.client.on('stopapp', async (i) => {
            if(interaction.user.id != i.user.id){return}
            if(!isCollecting){return}

            await app.stop()
            let data = await updateEmbed()
            await interaction.editReply({embeds: [data[0]], components: [data[1]]})
        })
        this.client.on('startapp', async () => {
            if(interaction.user.id != i.user.id){return}
            if(!isCollecting){return}

            await app.start()
            let data = await updateEmbed()
            await interaction.editReply({embeds: [data[0]], components: [data[1]]})
        })

        this.client.on('restartapp', async () => {
            if(interaction.user.id != i.user.id){return}
            if(!isCollecting){return}

            await app.restart()
            let data = await updateEmbed()
            await interaction.editReply({embeds: [data[0]], components: [data[1]]})
        })

        for(let i in [...Array(12).keys()]){
            await wait(5000)
            let data = await updateEmbed()
            await interaction.editReply({embeds: [data[0]], components: [data[1]]})
            if(i == 11){isCollecting = false}
        }

    }
}