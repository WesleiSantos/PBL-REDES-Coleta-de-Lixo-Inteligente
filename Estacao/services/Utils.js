const { promisify } = require('util');

class Utils  {
    constructor(redisClientService) {
        this.redisClientService = redisClientService;
    }

    async ordenaLixeiras() {
        const productKeys = await this.redisClientService.scan('lixeira:*');
        const productList = [];

        if (productKeys.length) {
            for (const key of productKeys) {
                const product = await this.redisClientService.jsonGet(key);

                productList.push(JSON.parse(product));
            }
            productList.sort(function (a, b) {
                if (a.capacidade < b.capacidade) {
                    return 1;
                }
                if (a.capacidade > b.capacidade) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
        }

        return productList;
    }
}

module.exports = Utils;

