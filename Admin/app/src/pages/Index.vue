<template>
  <q-page>
    <q-layout view="hHh Lpr fFf" class="tw-bg-white">
      <div class="q-pa-md row q-col-gutter-x-md q-col-gutter-y-md">

        <!---REGIAO A-->
        <div class="col-12 col-md-6">
          <q-card class="bg-grey-2 regiao">
            <q-card-section class="flex justify-between">
              <div class="text-h4">Região A</div>
              <q-input
                v-model="searchA"
                filled
                type="search"
                @keypress.enter="getTrash('A', searchA)"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
                <template v-slot:append>
                  <q-icon
                    name="close"
                    @click="
                      () => {
                        trashSelectA = null;
                        searchA = null;
                      }
                    "
                    class="cursor-pointer"
                  />
                </template>
              </q-input>
            </q-card-section>
            <div class="q-pa-md flex">
              <q-select v-model="qtd_a" :options="options" />
            </div>
            <div class="h-full" style="overflow-y: scroll; height: 70%">
              <div class="flex flex-start" v-if="!trashSelectA">
                <card-trash
                  v-for="trashA in listTrash_A"
                  :key="trashA.id"
                  :trash="trashA"
                />
              </div>
              <div class="flex flex-center" v-else>
                <card-trash :trash="trashSelectA" />
              </div>
            </div>
          </q-card>
        </div>

        <!---REGIAO B-->
        <div class="col-12 col-md-6">
          <q-card class="bg-grey-2 regiao">
            <q-card-section class="flex justify-between">
              <div class="text-h4">Região B</div>
              <q-input
                v-model="searchB"
                filled
                type="search"
                @keypress.enter="getTrash('B', searchB)"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
                <template v-slot:append>
                  <q-icon
                    name="close"
                    @click="
                      () => {
                        trashSelectB = null;
                        searchB = null;
                      }
                    "
                    class="cursor-pointer"
                  />
                </template>
              </q-input>
            </q-card-section>

            <div class="q-pa-md flex">
              <q-select v-model="qtd_b" :options="options" />
            </div>
            <div
              class="flex flex-start"
              v-if="!trashSelectB"
              style="overflow-y: scroll; height: 70%"
            >
              <card-trash
                v-for="trashB in listTrash_B"
                :key="trashB.id"
                :trash="trashB"
              />
            </div>
            <div class="flex flex-center" v-else>
              <card-trash :trash="trashSelectB" />
            </div>
          </q-card>
        </div>
      </div>
    </q-layout>
  </q-page>
</template>

<script>
import CardTrash from "../components/CardTrash.vue";
import TrashService from "../services/trashsService";
import { useQuasar } from "quasar";

export default {
  components: {
    CardTrash,
  },
  data() {
    return {
      qtd_b: null,
      qtd_a: null,
      $q: useQuasar(),
      listTrash_A: [],
      listTrash_B: [],
      options: [5, 10, 20, 30, 50],
      searchA: null,
      searchB: null,
      trashSelectA: null,
      trashSelectB: null,
    };
  },
  watch: {
    qtd_a(value) {
      this.getAllTrash("A", value);
    },
    qtd_b(value) {
      this.getAllTrash("B", value);
    },
  },
  mounted() {
    this.getAllTrash("A");
    this.getAllTrash("B");
  },
  methods: {
    getAllTrash(region, qtd = null) {
      TrashService.index(region, qtd)
        .then((resp) => {
          if (region == "A") {
            this.listTrash_A = resp.data;
          } else {
            this.listTrash_B = resp.data;
          }
        })
        .catch((e) => {
          console.log(e);
          this.$q.notify({
            color: "negative",
            position: "top",
            message: `Falha. Tente novamente`,
            icon: "report_problem",
          });
        });
    },
    getTrash(region, id) {
      TrashService.show(region, id)
        .then((resp) => {
          if (resp.data) {
            if (region == "A") {
              this.trashSelectA = resp.data;
            } else {
              this.trashSelectB = resp.data;
            }
          } else {
            this.$q.notify({
              color: "negative",
              position: "top",
              message: `Lixeira não encontrada`,
              icon: "report_problem",
            });
            this.trashSelectA = null;
            this.trashSelectB = null;
          }
        })
        .catch((e) => {
          console.log(e);
          this.$q.notify({
            color: "negative",
            position: "top",
            message: `Falha. Tente novamente`,
            icon: "report_problem",
          });
        });
    },
  },
};
</script>

<style lang="sass" scoped>
.regiao
  height: 80vh
</style>
