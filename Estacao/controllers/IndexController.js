
class LixeiraIndexController {
    constructor(redisClientService,utilsServices) {
        this.utilsServices  = utilsServices;
        this.redisClientService = redisClientService;
    }

    async index(req, res) {
        let qtd_lixeiras = req.params.qtd
        this.utilsServices.ordenaLixeiras().then(data=>{
            let lixeirasList = data;
            if(qtd_lixeiras > 0){
                lixeirasList = lixeirasList.slice(0, qtd_lixeiras);
            }
            return res.send(lixeirasList);
        })
    }

    async show(req, res){
        let id = req.params.id;
        this.redisClientService.jsonGet(`lixeira:${id}`).then(data=>{
            return res.send(data);
        }).catch(err=>{
            return res.send(err);
        });
    }
}

module.exports = LixeiraIndexController;