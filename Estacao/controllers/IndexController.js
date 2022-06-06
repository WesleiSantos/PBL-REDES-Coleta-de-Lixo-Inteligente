
class LixeiraIndexController {
    constructor(utilsServices) {
        this.utilsServices  = utilsServices;
    }

    async index(req, res) {
        this.utilsServices.ordenaLixeiras().then(data=>{
            let lixeirasList = data;
            return res.send(lixeirasList);
        })
    }
}

module.exports = LixeiraIndexController;