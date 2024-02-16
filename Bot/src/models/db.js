const Sequelize = require('sequelize')

/* Database usando Sequelize & sqlite */
module.exports = class extends Sequelize{
    constructor(name, options){
        super('database', 'admin', 'root', {host: 'localhost',dialect: 'sqlite',logging: false,storage: 'database.sqlite'})
        
        this.API.sync();


        console.log(`[DATABASE] Loaded`)
    }
    
    /* Tabela que será usada para armazenar os dados de usuários */
    API = this.define('api', {
        username: Sequelize.STRING,
        userid: Sequelize.STRING,
        api_key: Sequelize.STRING
    })
}
