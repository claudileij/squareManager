const Sequelize = require('sequelize')

module.exports = class extends Sequelize{
    constructor(name, options){
        super('database', 'admin', 'root', {host: 'localhost',dialect: 'sqlite',logging: false,storage: 'database.sqlite'})
        
        this.API.sync();


        console.log(`[DATABASE] Loaded`)
    }
    
    API = this.define('api', {
        username: Sequelize.STRING,
        userid: Sequelize.STRING,
        api_key: Sequelize.STRING
    })
}
