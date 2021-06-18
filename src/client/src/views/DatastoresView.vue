<template>
  <div class="layout vertical padded">
    <el-card
      v-for="datastore in enabledDatastoreDefs"
      :key="datastore.name"
      :body-style="{ padding: '0px' }"
      class="spacer"
      :class="$style.card"
      style="width: auto;"
    >
      <router-link
        :to="{ name: datastore.routeName }"
        :class="$style.link"
        class="padded"
      >
        <img
          v-if="datastore.imagePath"
          :src="datastore.imagePath"
          :class="$style.datastoreIcon"
          class="image"
        />
        <font-awesome-icon
          v-else
          :icon="datastore.faIcon"
          :class="[$style.datastoreIcon, $style.faDatastoreIcon]"
        ></font-awesome-icon>

        <h2 :class="$style.datastoreName">{{ datastore.name }}</h2>

        <div :class="$style.datastoreDescription">
          {{ datastore.description }}
        </div>
      </router-link>
    </el-card>
    <router-view></router-view>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Card } from 'element-ui';
import { Routes } from '@/router/routes';
import { DatastoreDef, getDatastores } from '@/datastore-definitions';
import { getDatastoreTypes } from '@/services/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default Vue.extend({
  name: 'DatastoresView',
  components: {
    [Button.name]: Button,
    [Card.name]: Card,
    FontAwesomeIcon,
  },
  data() {
    return {
      Routes,
      enabledDatastores: new Array<string>(),
    };
  },
  computed: {
    enabledDatastoreDefs(): DatastoreDef[] {
      const enabledDatastoreSet = new Set(this.enabledDatastores);
      return Object.entries(getDatastores()).reduce(
        (prev, [type, datastore]) => {
          if (enabledDatastoreSet.has(type)) {
            prev.push(datastore);
          }
          return prev;
        },
        new Array<DatastoreDef>(),
      );
    },
  },
  created() {
    this.fetchDatastoreTypes();
  },
  methods: {
    async fetchDatastoreTypes() {
      // the server dictates which datastores are supported
      this.enabledDatastores = await getDatastoreTypes();
    },
  },
});
</script>
<style module>
.link {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 200px auto;
  grid-template-rows: 60px 60px;
  text-decoration: none !important;
  color: #606266 !important;
}

.container {
  background-color: var(--neutral-050);
}

.datastoreIcon {
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
  justify-self: center;
  max-width: 125px;
  max-height: 125px;
  width: auto;
  height: auto;
}

.datastoreName {
  grid-column: 2;
  grid-row: 1;
  margin: 0;
  align-self: center;
}

.card:hover .datastoreName {
  color: var(--color-action);
}

.datastoreDescription {
  grid-column: 2;
  grid-row: 2;
  font-size: 16px;
}

.faDatastoreIcon {
  font-size: 60px;
}
</style>
