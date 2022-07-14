<template>
  <div class="q-pa-md row items-start q-gutter-md">
    <q-card class="my-card" :class="[{ 'bg-primary': selected }, { 'bg-white': !selected }]"
      @click="selectTrash(trash.id, trash.regiao)">
      <q-item-section top avatar>
        <q-avatar rounded class="q-mx-auto q-my-xs">
          <img src="https://cdn-icons-png.flaticon.com/512/54/54324.png" />
        </q-avatar>
      </q-item-section>
      <q-list>
        <q-item clickable v-ripple>
          <q-item-section>
            <q-item-label>ID</q-item-label>
            <q-item-label caption>{{ trash.id ? trash.id : "????" }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple>
          <q-item-section>
            <q-item-label>Região</q-item-label>
            <q-item-label caption>{{ trash.regiao ? trash.regiao : "????" }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple>
          <q-item-section>
            <q-item-label>Capacidade Utilizada</q-item-label>
            <q-item-label caption>{{ trash.capacidade ? trash.capacidade : "????" }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="expand" clickable v-ripple>
          <q-item-section>
            <q-item-label>Distancia para o caminhão</q-item-label>
            <q-item-label caption>{{ trash.distancia ? trash.distancia : "????" }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="expand" clickable v-ripple>
          <q-item-section>
            <q-item-label>Longitude</q-item-label>
            <q-item-label caption>{{ trash.longitude ? trash.longitude : "????" }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="expand" clickable v-ripple>
          <q-item-section>
            <q-item-label>Latitude</q-item-label>
            <q-item-label caption>{{ trash.latitude ? trash.latitude : "????" }}</q-item-label>
          </q-item-section>
        </q-item>
        <div class="flex justify-center q-mb-xs">
          <q-btn size="xs" unelevated round color="primary" icon="open_in_full" />
        </div>
      </q-list>
    </q-card>
  </div>
</template>

<script>
export default {
  props: {
    trash: {
      type: Object,
    },
    origin_region: {
      type: String
    },
    expand: {
      type: Boolean
    }
  },
  data() {
    return {
      selected: false
    }
  },
  methods: {
    selectTrash(id, region) {
      this.selected = !this.selected;
      this.$emit('trashSelected', this.selected, id, region, this.origin_region);
    }
  }
};
</script>
<style lang="sass" scoped>
.my-card
  width: 100%
  max-width: 250px
</style>
