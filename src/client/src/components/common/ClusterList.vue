<template>
  <div :class="$style.clusterList" class="cluster-list layout vertical">
    <div class="padded">
      <el-input
        v-model="search"
        :placeholder="'Search for a ' + datastoreName + ' cluster'"
      >
        <i slot="prefix" class="el-input__icon el-icon-search"></i
      ></el-input>
    </div>

    <div
      :class="$style.contentRegion"
      class="flex border__top layout horizontal"
      style="overflow: hidden;"
    >
      <div v-if="clusterNameRows.length === 0" class="padded">
        <div>No matches found</div>
        <p>{{ $t('clusterList.noClusters.title') }}</p>
        <i18n path="clusterList.noClusters.remediation" tag="p">
          <a :href="$t('clusterList.noClusters.link.href')" target="_blank">{{
            $t('clusterList.noClusters.link.label')
          }}</a>
        </i18n>
      </div>

      <template v-else>
        <ul role="menu" :class="$style.clusterNameList" class="flex">
          <li
            v-for="cluster in clusterNameRows"
            :key="cluster.name"
            :class="{ [$style.active]: selectedClusterName === cluster.name }"
            @click="selectedClusterName = cluster.name"
          >
            <div v-if="showSharedIcon" :class="$style.sharedIconContainer">
              <el-tooltip content="Shared Cluster" placement="bottom">
                <font-awesome-icon
                  v-if="cluster.isShared"
                  :class="$style.sharedClusterIcon"
                  class="spacer__right"
                  :icon="faUsers"
                  fixed-width
                ></font-awesome-icon>
              </el-tooltip>
            </div>

            <span>{{ cluster.name }}</span>

            <i class="el-icon-arrow-right"></i>
          </li>
        </ul>

        <ul role="menu">
          <li
            v-for="env in clusterEnvs"
            :key="env"
            :class="{ [$style.active]: selectedClusterEnv === env }"
            @click="selectedClusterEnv = env"
          >
            <span>{{ env }}</span>
            <i class="el-icon-arrow-right"></i>
          </li>
        </ul>

        <ul role="menu" style="border-right: solid 1px #e4e7ed;">
          <li
            v-for="region in clusterRegions"
            :key="region"
            :class="{ [$style.active]: selectedClusterRegion === region }"
            @click="selectRegion(region)"
          >
            <span>{{ region }}</span>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { Input, Menu, MenuItem, Tooltip } from 'element-ui';
import { Routes } from '@/router/routes';
import { IClusterRegionSummary } from '@sharedtypes/typings';
import { routeToCluster } from '@/utils/region-utils';
import { getDatastores } from '@/datastore-definitions';

interface IClusterNameRow {
  name: string;
  isShared: boolean;
}

export default Vue.extend({
  name: 'ClusterList',
  components: {
    FontAwesomeIcon,
    [Menu.name]: Menu,
    [MenuItem.name]: MenuItem,
    [Input.name]: Input,
    [Tooltip.name]: Tooltip,
  },
  props: {
    data: {
      type: Array as Prop<IClusterRegionSummary[]>,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
    },
    showSharedIcon: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      Routes,
      faUsers,
      search: '',
      selectedClusterName: undefined as string | undefined,
      selectedClusterEnv: undefined as string | undefined,
      selectedClusterRegion: undefined as string | undefined,
    };
  },
  computed: {
    datastoreName(): string {
      return getDatastores()[this.type].name;
    },
    filteredData(): IClusterRegionSummary[] {
      return this.data.filter((item) =>
        item.name.toLowerCase().includes(this.search.toLowerCase()),
      );
    },
    clusterNameRows(): IClusterNameRow[] {
      const map = this.filteredData.reduce(
        (names, curr) => names.set(curr.name, curr.isShared),
        new Map<string, boolean>(),
      );
      const result = new Array<IClusterNameRow>();
      for (const [name, isShared] of map.entries()) {
        result.push({ name, isShared });
      }
      return result;
    },
    clusterEnvs(): string[] {
      if (!this.selectedClusterName) return [];
      return Array.from(
        this.filteredData
          .filter((cluster) => cluster.name === this.selectedClusterName)
          .reduce(
            (envs, curr) => envs.add(curr.env.toUpperCase()),
            new Set<string>(),
          ),
      ).sort();
    },
    clusterRegions(): string[] {
      if (!this.selectedClusterName || !this.selectedClusterEnv) return [];
      return Array.from(
        this.filteredData
          .filter(
            (cluster) =>
              cluster.name === this.selectedClusterName &&
              cluster.env === (this.selectedClusterEnv as string).toLowerCase(),
          )
          .reduce(
            (regions, curr) => regions.add(curr.region.toUpperCase()),
            new Set<string>(),
          ),
      ).sort();
    },
  },
  mounted() {
    if (
      this.clusterNameRows.length === 1 &&
      this.clusterNameRows[0].name === 'localhost'
    ) {
      routeToCluster(this.type, 'localhost', 'local', 'local');
    }
  },
  methods: {
    selectRegion(region: string) {
      if (!this.selectedClusterName || !this.selectedClusterEnv) return;
      routeToCluster(
        this.type,
        this.selectedClusterName,
        this.selectedClusterEnv.toLowerCase(),
        region.toLowerCase(),
      );
    },
  },
});
</script>
<style module>
.datastoreTypeLabel {
  text-transform: capitalize;
}

.contentRegion {
  width: 700px;
}

.clusterList ul {
  border-right: 1px solid rgb(228, 231, 237);
  cursor: pointer;
  height: 100%;
  list-style-type: none;
  min-width: 175px;
  overflow: auto;
  padding: 0 20px 0 20px;
}

.clusterList ul li {
  align-items: center;
  display: flex;
  height: 34px;
  line-height: 34px;
}

.clusterList ul li.active {
  color: #149bb3;
  font-weight: 700;
}

.clusterList ul li span {
  flex: 1;
}

.clusterNameList {
  width: 300px;
}

.sharedIconContainer {
  display: inline-block;
  width: 22px;
}
</style>
