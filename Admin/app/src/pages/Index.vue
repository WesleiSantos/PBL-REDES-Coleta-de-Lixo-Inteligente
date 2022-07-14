<template>
  <q-page padding>
    <div class="q-pa-md q-col-gutter-y-md">
      <div class="row q-col-gutter-x-md q-col-gutter-y-md">
        <!---REGIOES-->
        <div class="col-12 col-md-6" v-for="(region, index) in regions" :key="index" style="height: 260px">
          <q-card class="regiao" :class="[{'bg-grey-2':!region.reserve, 'bg-secondary':region.reserve}]">
            <q-card-section class="flex justify-between">
              <div class="text-h6">Região {{ region.label }}</div>
            </q-card-section>
            <q-scroll-area style="height: 170px; width: 100%;" v-if="!trashSelect">
              <template class="flex flex-start">
                <card-trash @trashSelected="selectTrash" v-for="trash in region.list_trash" :key="trash.id"
                  :trash="trash" :origin_region="region.label" :requestReserve="region.requestReserve"/>
              </template>
            </q-scroll-area>
            <div class="flex flex-center" v-else>
              <card-trash :trash="trashSelect" />
            </div>
          </q-card>
        </div>
      </div>
      <div class="row ">
        <div class="col flex justify-center q-mt-md">
          <q-btn size="lg" unelevated color="primary" @click="( ) => $router.go() " icon-right="search" class="q-mx-xs"
            label="Buscar" />
          <q-btn size="lg" unelevated color="primary" @click="reserve()" :disabled="is_reserving" icon-right="send" class="q-mx-xs" label="Requisitar" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import CardTrash from "../components/CardTrash.vue";
import TrashService from "../services/trashsService";
import { useQuasar } from "quasar";

const regions = [
  {
    label: "A",
    list_trash: [],
    list_selected: [],
    requestReserve: false,
    reserve: false
  },
  {
    label: "B",
    list_trash: [],
    list_selected: [],
    requestReserve: false,
    reserve: false
  },
  {
    label: "C",
    list_trash: [],
    list_selected: [],
    requestReserve: false,
    reserve: false
  },
  {
    label: "D",
    list_trash: [],
    list_selected: [],
    requestReserve: false,
    reserve: false
  }
]

export default {
  components: {
    CardTrash,
  },
  data() {
    return {
      is_reserving:false,
      regions,
      $q: useQuasar(),
      options: [5, 10, 20, 30, 50],
      trashSelect: null
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
    this.getAllTrash("C");
    this.getAllTrash("D");
  },
  methods: {
    selectTrash(status, id, region, origin) {
      const filterTrahs = (e) => {
        return {
          ...e,
          list_selected: e.label == origin ? e.list_selected.filter(e => e.id != id) : [...e.list_selected] 
        }
      }
      let regionSelected = this.regions.find(e => e.label == origin);
      if (status) {
        regionSelected.list_selected.push({ id, region });
      } else {
        this.regions = this.regions.map(filterTrahs);
      }
    },
    reserve() {
      this.is_reserving = true;
      let listSelectedB = this.regions.find(e => e.label == 'B').list_selected;
      let listSelectedA = this.regions.find(e => e.label == 'A').list_selected;
      let listSelectedC = this.regions.find(e => e.label == 'C').list_selected;
      let listSelectedD = this.regions.find(e => e.label == 'D').list_selected;
      this.regions = this.regions.map(e =>{
        return {...e, requestReserve: true}
      });
      TrashService.reserve('B', listSelectedB).then(data => {
        console.log(data)
      }).catch(e => {
        console.log(e);
      });
       TrashService.reserve('A', listSelectedA).then(data => {
        console.log(data)
      }).catch(e => {
        console.log(e);
      });
      TrashService.reserve('C', listSelectedC).then(data => {
        console.log(data)
      }).catch(e => {
        console.log(e);
      });
      TrashService.reserve('D', listSelectedD).then(data => {
        console.log(data)
      }).catch(e => {
        console.log(e);
      });

      setInterval(this.verifyReserves,2000);

    },
    verifyReserves(){
       TrashService.verifyReserve('B').then(({data}) => {
        this.regions = this.regions.map(e => {return e.label == 'B' ? {...e, reserve:data} : {...e}})
      }).catch(e => {
        console.log(e);
      });
       TrashService.verifyReserve('A').then(({data}) => {
        this.regions = this.regions.map(e => {return e.label == 'A' ? {...e, reserve:data} : {...e}})
        console.log(data)
      }).catch(e => {
        console.log(e);
      });
      TrashService.verifyReserve('C').then(({data}) => {
        this.regions = this.regions.map(e => {return e.label == 'C' ? {...e, reserve:data} : {...e}})
        console.log(data)
      }).catch(e => {
        console.log(e);
      });
      TrashService.verifyReserve('D').then(({data}) => {
        this.regions = this.regions.map(e => {return e.label == 'D' ? {...e, reserve:data} : {...e}})
        console.log(data)
      }).catch(e => {
        console.log(e);
      });
    },
    searchAll() {
      this.getAllTrash("A");
      this.getAllTrash("B");
      this.getAllTrash("C");
      this.getAllTrash("D");
    },
    getAllTrash(region, qtd = null) {
      TrashService.index(region, qtd)
        .then((resp) => {
          console.log(resp)
          let region_selected = this.regions.find(e => e.label == region);
          region_selected.list_trash = resp.data;
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

<style lang="css" scoped>
.regiao {
  height: 100%;
}
</style>
