const Client = require('./src/base/Client');
const Sequelize = require('./src/models/db');
const {GatewayIntentBits} = require('discord.js')
require('dotenv').config();

/* Definindo banco de dados do Sequelize, e passando o mesmo pra classe Client */
let db = new Sequelize()
let client = new Client(db, {intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
]})



client.login(process.env.TOKEN)
