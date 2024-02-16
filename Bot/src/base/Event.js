module.exports = class Event{
    constructor(client, options){
        this.name = options.name
        this.client = client
    }
}