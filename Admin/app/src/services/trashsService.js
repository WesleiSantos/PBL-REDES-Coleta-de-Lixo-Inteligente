import { api_a, api_b, api_c, api_d } from "boot/axios";

let a = api_a.defaults.baseURL.split("/")[2];
let b = api_b.defaults.baseURL.split("/")[2];
let c = api_c.defaults.baseURL.split("/")[2];
let d = api_d.defaults.baseURL.split("/")[2];
export default {
  index: (region, qtd=null) => {
    if (region == "A") {
      return api_a.get(`lixeiras/${qtd}/${b}/${c}/${d}`);
    } else if (region == "B") {
      return api_b.get(`lixeiras/${qtd}/${a}/${c}/${d}`);
    } else if (region == "C") {
      return api_c.get(`lixeiras/${qtd}/${a}/${b}/${d}`);
    } else if (region == "D") {
      return api_d.get(`lixeiras/${qtd}/${a}/${b}/${c}`);
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
  reserve: (region, list_dumps) => {
    if (region == "A") {
      return api_a.get(`reserve`, {params:list_dumps});
    } else if (region == "B") {
      return api_b.get(`reserve`, {params:list_dumps});
    } else if (region == "C") {
      return api_c.get(`reserve`, {params:list_dumps});
    } else if (region == "D") {
      return api_d.get(`reserve`, {params:list_dumps});
    }
  }
};
