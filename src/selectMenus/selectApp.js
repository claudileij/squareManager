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
        const app = await square.applications.get(appId);

        /* Função que irá retornar os status da aplicação atualizadas */
        const updateEmbed = async () => {
            const appStatus = await app.getStatus();
            let appLogs
            try {
                appLogs = await app.getLogs();
            } catch (error) {
                appLogs = "NO-LOGS"
            }



            const buttonStart = new ButtonBuilder().setCustomId('startapp').setLabel('Start').setStyle(ButtonStyle.Success)
                .setDisabled(appStatus.running)
            const buttonStop = new ButtonBuilder().setCustomId('stopapp').setLabel('Stop').setStyle(ButtonStyle.Danger)
                .setDisabled(appStatus.running == false)
            const buttonRestart = new ButtonBuilder().setCustomId('restartapp').setLabel('Restart').setStyle(ButtonStyle.Primary);
            const appRow = new ActionRowBuilder().addComponents(buttonStart, buttonStop, buttonRestart)

            const estilizedStatus = appStatus.status == 'running' ? '```diff\n+ running \n```' : '```diff\n- exited \n```'
            const appEmbed = new EmbedBuilder()
                .setTitle(app.name)
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

        const stoppingEmbed = new EmbedBuilder()
        .setTitle("Encerrando...")
        .setDescription("Aguarde um momento até que sua aplicação seja encerrada, este embed será atualizado assim que terminarmos 😉")
        .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')

        const startingEmbed = new EmbedBuilder()
        .setTitle("Iniciando...")
        .setDescription("Aguarde um momento até que sua aplicação seja iniciada, este embed será atualizado assim que terminarmos 😉")
        .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')

        const restartingEmbed = new EmbedBuilder()
        .setTitle("Reiniciando...")
        .setDescription("Aguarde um momento até que sua aplicação seja reiniciada, este embed será atualizado assim que terminarmos 😉")
        .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')

        const gettingApplication = new EmbedBuilder()
        .setTitle("Coletando aplicação...")
        .setDescription("Aguarde um momento até que os dados da sua aplicação sejam coletados, este embed será atualizado assim que terminarmos 😉")
        .setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75')


        await interaction.reply({embeds: [gettingApplication], ephemeral: true})
        const appData = await updateEmbed()
        
        var isCollecting = true
        await interaction.editReply({ embeds: [appData[0]], components: [appData[1]], ephemeral: true })

        

        /* Eventos dos buttons emitidos pelo interaction.js */
        this.client.on('stopapp', async (i) => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }

            await interaction.editReply({embeds: [stoppingEmbed]})
            await app.stop()
            await wait(5000)
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
        })
        this.client.on('startapp', async (i) => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }

            await interaction.editReply({embeds: [startingEmbed]})
            await app.start()
            await wait(5000)
            const appData = await updateEmbed()
            await interaction.editReply({embeds: [appData[0]], components: [appData[1]] })
        })

        this.client.on('restartapp', async (i) => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }

            await interaction.editReply({embeds: [restartingEmbed], components: []})
            await app.restart()
            await wait(5000)
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
        })

        for (const i in [...Array(12).keys()]) {
            await wait(10000)
            const appData = await updateEmbed()
            await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
            if (i == 11) { isCollecting = false }
        }

    }
}