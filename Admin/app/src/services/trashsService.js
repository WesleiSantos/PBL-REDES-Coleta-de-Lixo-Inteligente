import { api_a, api_b, api_c, api_d } from "boot/axios";

export default {
  index: (region, qtd=null) => {
    if (region == "A") {
      return api_a.get(`lixeiras/${qtd}`);
    } else if (region == "B") {
      return api_b.get(`lixeiras/${qtd}`);
    } else if (region == "C") {
      return api_c.get(`lixeiras/${qtd}`);
    } else if (region == "D") {
      return api_d.get(`lixeiras/${qtd}`);
    }
  },
  keys: (region, qtd=null) => {
    if (region == "A") {
      return api_a.get(`lixeiras/${qtd}`);
    } else {
      return api_b.get(`lixeiras/${qtd}`);
    }
  },
  show: (region, id) => {
    if (region == "A") {
      return api_a.get(`lixeira/${id}`);
    } else {
      return api_b.get(`lixeira/${id}`);
    }
  },
};
