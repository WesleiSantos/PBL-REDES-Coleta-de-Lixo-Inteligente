class LixeiraIndexController {
    
    constructor(redisClientService,utilsServices) {
        this.utilsServices  = utilsServices;
        this.redisClientService = redisClientService;
    }
    async index(req, res) {
        let qtd_lixeiras = req.params.qtd
        //const axios = require('axios');
        
        let estacoes = [req.params.reg1, req.params.reg2, req.params.reg3]
        console.log(">>> REGION 1 = "+estacoes[0])
        console.log(">>> REGION 2 = "+estacoes[1])
        console.log(">>> REGION 3 = "+estacoes[2])

        const axios = require('axios');
        for(let i=0; i < estacoes.length; i++){

            axios.get(`http:${estacoes[i]}/api/all`).then((resp) => {
                console.log("RESPOSTA", resp.data)
            }).catch((e) => {
                console.log("erro: ", e.response.data);
            });
        }
        

        //const response =  axios.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
        //console.log(response.data.url);
        //console.log(response.data.explanation);
            
        //const api_reg1 = axios.create({ baseURL: `http://${req.params.reg1}/api/lixeiras/all` });
        //console.log(">>>>>> "+api_reg1.defaults.baseURL)
        /*api_reg1.get('/').then((resp) => {
            console.log(resp)
            //let region_selected = this.regions.find(e => e.label == region);
            //region_selected.list_trash = resp.data;
            })
            .catch((e) => {
            console.log(e);
            this.$q.notify({
                color: "negative",
                position: "top",
                message: `Falha. Tente novamente`,
                icon: "report_problem",
            });
        });*/

        this.utilsServices.ordenaLixeiras().then(data=>{
            let lixeirasList = data;
            if(qtd_lixeiras > 0){
                lixeirasList = lixeirasList.slice(0, qtd_lixeiras);
            }
            return res.send(lixeirasList);
        })
    }
    
    async all(req, res) {
        let qtd_lixeiras = null
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