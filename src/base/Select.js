/* Classe Select, que será usado e exportado pelos menus em: ../selectMenus/* */

class Select{
    constructor(client, options){
        this.client = client
        this.name = options.name
    }
}

module.exports = Select