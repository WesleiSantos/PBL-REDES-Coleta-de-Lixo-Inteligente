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
        }
        
        return productList;
    }
}

module.exports = Utils;

