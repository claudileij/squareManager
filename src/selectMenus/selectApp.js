const Select = require('../base/Select')
const wait = require('node:timers/promises').setTimeout;
const { SquareCloudAPI } = require('@squarecloud/api')
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ComponentType } = require('discord.js')

/* Classe Select, iniciada quando o select menu com o mesmo name for utilizado */
module.exports = class extends Select {
    constructor(client) {
        super(client, {
            name: 'selectapps'
        })
    }

    run = async (interaction) => {
        const appId = interaction.values[0] // Id da aplicação, passada como value nas options do select menu
        if (appId == "semapps") { return interaction.reply({ content: "Você não tem aplicações, faça o upload no site da square: https://squarecloud.app", ephemeral: true }) } // Caso o usuário não tenha aplicações hospedadas

        const db = this.client.db.API // Atalho pra acessar a db, posteriormente definida na classe Client
        const dbUser = await db.findOne({ where: { userid: interaction.user.id } }); // Procurando se um usuário já está no banco de dados pelo userid

        /* Definindo o app */
        const square = new SquareCloudAPI(dbUser.api_key)
        const user = await square.users.get();
        const app = await user.applications.get(appid);

        /* Função que irá retornar os status da aplicação atualizadas */
        const updateEmbed = async () => {
            const appStatus = await app.getStatus();
            const appLogs = await app.getLogs();

            const buttonStart = new ButtonBuilder().setCustomId('startapp').setLabel('Start').setStyle(ButtonStyle.Success)
                .setDisabled(appStatus.running)
            const buttonStop = new ButtonBuilder().setCustomId('stopapp').setLabel('Stop').setStyle(ButtonStyle.Danger)
                .setDisabled(appStatus.running == false)
            const buttonRestart = new ButtonBuilder().setCustomId('restartapp').setLabel('Restart').setStyle(ButtonStyle.Primary);
            const appRow = new ActionRowBuilder().addComponents(buttonStart, buttonStop, buttonRestart)

            const estilizedStatus = appStatus.status == 'running' ? '```diff\n+ running \n```' : '```diff\n- exited \n```'
            const appEmbed = new EmbedBuilder()
                .setTitle(app.tag)
                .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')
                .addFields(
                    { name: "CPU", value: '`' + appStatus.usage.cpu + '`', inline: true },
                    { name: "RAM", value: '`' + appStatus.usage.ram + '`', inline: true },
                    { name: 'STORAGE', value: '`' + appStatus.usage.storage + '`', inline: true },
                    { name: "STATUS", value: estilizedStatus, inline: true },
                    { name: 'LOGS', value: '```bash\n' + appLogs.slice(-200) + '\n```', inline: false }
                )

            return [appEmbed, appRow]

        }


        const appData = await updateEmbed()
        var isCollecting = true
        await interaction.reply({ embeds: [appData[0]], components: [appData[1]], ephemeral: true })

        /* Eventos dos buttons emitidos pelo interaction.js */
        this.client.on('stopapp', async (i) => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }

            await app.stop()
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
        })
        this.client.on('startapp', async () => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }

            await app.start()
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
        })

        this.client.on('restartapp', async () => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }

            await app.restart()
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
        })

        for (const i in [...Array(12).keys()]) {
            await wait(5000)
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
            if (i == 11) { isCollecting = false }
        }

    }
}