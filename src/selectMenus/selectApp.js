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
            const buttonBackup = new ButtonBuilder().setCustomId('backupapp').setEmoji('📦').setStyle(ButtonStyle.Secondary)
            const appRow = new ActionRowBuilder().addComponents(buttonStart, buttonStop, buttonRestart, buttonBackup)

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

        /* Embed para esperar a resposta da api */
        const statusEmbed = (title, description) => {return new EmbedBuilder().setTitle(title).setDescription(description).setThumbnail('https://squarecloud.app/_next/image?url=%2Flogo.png&w=1080&q=75').setFooter({text: 'Ignore o aviso de "Esta interação falhou"'})}

        const stoppingEmbed = statusEmbed("Encerrando...", "Aguarde um momento até que sua aplicação seja encerrada, este embed será atualizado assim que terminarmos 😉")
        const startingEmbed = statusEmbed("Iniciando...", "Aguarde um momento até que sua aplicação seja iniciada, este embed será atualizado assim que terminarmos 😉")
        const restartingEmbed = statusEmbed("Reiniciando...", "Aguarde um momento até que sua aplicação seja reiniciada, este embed será atualizado assim que terminarmos 😉")
        const gettingApplication = statusEmbed("Coletando aplicação...", "Aguarde um momento até que os dados da sua aplicação sejam coletados, este embed será atualizado assim que terminarmos 😉")
        const gettingBackup = statusEmbed("Preparando backup...", "Aguarde um momento até que o backup da sua aplicação esteja pronto, este embed será atualizado assim que terminarmos 😉")

        let isCollecting = true
        let autoUpdate = true


        await interaction.reply({ embeds: [gettingApplication], ephemeral: true })
        const appData = await updateEmbed()
        await interaction.editReply({ embeds: [appData[0]], components: [appData[1]], ephemeral: true })


        /* Verifica a interação, se isCollecting for false, então ele retornará.
        Para evitar que a interação seja atualizada enquanto estiver realizando alguma ação, define autoUpdate como false e novamente true */
        const handleEvent = async (i, func) => {
            if (interaction.user.id != i.user.id) { return }
            if (!isCollecting) { return }
            autoUpdate = false
            await func();
            autoUpdate = true
        }

        /* Eventos dos buttons emitidos pelo interaction.js */
        this.client.on('stopapp', async (i) => {
            await handleEvent(i, async () => {
                await interaction.editReply({ embeds: [stoppingEmbed], components: [] })
                await app.stop()
                await wait(5000)
                const appData = await updateEmbed()
                await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
            })
        })
        this.client.on('startapp', async (i) => {
            await handleEvent(i, async () => {
                await interaction.editReply({ embeds: [startingEmbed], components: [] })
                await app.start()
                await wait(5000)
                const appData = await updateEmbed()
                await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
            })
        })

        this.client.on('restartapp', async (i) => {
            await handleEvent(i, async () => {
                await interaction.editReply({ embeds: [restartingEmbed], components: [] })
                await app.restart()
                await wait(5000)
                const appData = await updateEmbed()
                await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
            })
        })

        this.client.on('backupapp', async (i) => {
            await handleEvent(i, async () => {
                await interaction.editReply({ embeds: [gettingBackup], components: [] })
                const backupUrl = await app.backup.url()
                const backupRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(backupUrl).setLabel('Download').setStyle(ButtonStyle.Link))
                const backupMessage = statusEmbed('Backup pronto 📦', 'Basta clicar no botão de download abaixo para obter o backup de sua aplicação.')
                await interaction.editReply({ embeds: [backupMessage], components: [backupRow] })
                isCollecting = false
            })
        })

        /* Loop que irá atualizar constantemente os status da aplicação */
        let idx = 0
        while (idx < 30 && isCollecting) {
            await wait(10000)
            if (autoUpdate && isCollecting) {
                const appData = await updateEmbed()
                await interaction.editReply({ embeds: [appData[0]], components: [appData[1]] })
            }
            idx++
        }

        return

    }
}