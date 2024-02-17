/* Exportando a classe Event, que será pelos registradores de eventos em ../events/* */

module.exports = class Event {
    constructor(client, options) {
        this.name = options.name
        this.client = client
    }
}