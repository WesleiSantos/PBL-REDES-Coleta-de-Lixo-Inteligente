class LixeiraIndexController {

    constructor(redisClientService, utilsServices, axios, mutualExclusionServices) {
        this.utilsServices = utilsServices;
        this.redisClientService = redisClientService;
        this.axios = axios;
        this.mutualExclusionServices = mutualExclusionServices;
    }
    async index(req, res) {
        let qtd_lixeiras = req.params.qtd
        //const axios = require('axios');
        this.mutualExclusionServices.reset();
        let estacoes = [req.params.reg1, req.params.reg2, req.params.reg3]
        console.log(">>> REGION 1 = " + estacoes[0])
        console.log(">>> REGION 2 = " + estacoes[1])
        console.log(">>> REGION 3 = " + estacoes[2])
        let array = []
        for (let i = 0; i < estacoes.length; i++) {
            this.axios.get(`http://${estacoes[i]}/api/all`).then((resp) => {
                //console.log("RESPOSTA", resp.data)
                array.push(...resp.data)
                if (i == estacoes.length-1) {
                    console.log(array)
                    this.utilsServices.ordenaLixeiras(array).then(data => {
                        let lixeirasList = data;
                        if (qtd_lixeiras > 0) {
                            lixeirasList = lixeirasList.slice(0, qtd_lixeiras);
                        }
                        return res.send(lixeirasList);
                    })
                }
            }).catch((e) => {
                console.log("erro: ", e);
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


    }

    async all(req, res) {
        let qtd_lixeiras = null
        this.utilsServices.ordenaLixeiras().then(data => {
            let lixeirasList = data;
            if (qtd_lixeiras > 0) {
                lixeirasList = lixeirasList.slice(0, qtd_lixeiras);
            }
            return res.send(lixeirasList);
        })
    }

    async reserve(req, res) {
        console.log(req.query)
        let array = [];
        for (const [key, value] of Object.entries(req.query)) {
            array.push(JSON.parse(value));
        }

        this.mutualExclusionServices.enter_cs(array);

        return res.send(array);
    }

    async verifyStatusReserve(req, res) {
        if (this.mutualExclusionServices.getRegionCritical()) {
            return res.send(true);
        } else {
            return res.send(false);
        }
    }


    async show(req, res) {
        let id = req.params.id;
        this.redisClientService.jsonGet(`lixeira:${id}`).then(data => {
            return res.send(data);
        }).catch(err => {
            return res.send(err);
        });
    }
}

module.exports = LixeiraIndexController;