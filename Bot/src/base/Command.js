class Command{
    constructor(client, options){
        this.name = options.name
        this.description = options.description
        this.options = options.options
        this.client = client
    }
}

module.exports = Command