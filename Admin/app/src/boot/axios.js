import { boot } from "quasar/wrappers";
import axios from "axios";

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api_a = axios.create({ baseURL: `http://${process.env.REGIAO_A_HOST}:${process.env.REGIAO_A_PORT}/api/` });
const api_b = axios.create({ baseURL: `http://${process.env.REGIAO_B_HOST}:${process.env.REGIAO_B_PORT}/api/` });
const api_c = axios.create({ baseURL: `http://${process.env.REGIAO_C_HOST}:${process.env.REGIAO_C_PORT}/api/` });
const api_d = axios.create({ baseURL: `http://${process.env.REGIAO_D_HOST}:${process.env.REGIAO_D_PORT}/api/` });

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file
  app.config.globalProperties.$api_a = api_a;
  app.config.globalProperties.$api_b = api_b;
  app.config.globalProperties.$api_c = api_c;
  app.config.globalProperties.$api_d = api_d;

  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api_a, api_b, api_c, api_d };
