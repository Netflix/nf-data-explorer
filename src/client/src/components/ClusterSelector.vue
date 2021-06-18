<template>
  <div class="layout horizontal center padded__horizontal">
    <div
      v-if="
        !showCascader && currentCluster && currentRegion && currentEnvironment
      "
      :class="$style.clusterLabel"
      class="layout horizontal center"
      @click="onShowCascader"
    >
      <el-tooltip content="Shared Cluster" placement="bottom">
        <font-awesome-icon
          v-if="isSharedCluster"
          :class="$style.sharedClusterIcon"
          class="spacer__right"
          :icon="faUsers"
          fixed-width
        ></font-awesome-icon>
      </el-tooltip>
      <div :class="$style.clusterNameLabel">{{ currentCluster }}</div>

      <!-- env/region -->
      <div
        v-if="!isLocal"
        :class="$style.clusterLocation"
        class="layout horizontal center spacer__left"
      >
        <div :class="$style.regionLabel">{{ currentRegion }}</div>
        <div
          :class="[$style.environmentLabel, isProd ? $style.prod : isProd]"
          class="spacer__left"
        >
          {{ currentEnvironment }}
        </div>
      </div>

      <div :class="$style.dropDownTrigger" class="spacer__left">
        <font-awesome-icon :icon="faSortDown"></font-awesome-icon>
      </div>
    </div>

    <el-cascader
      v-else-if="availableEnvironments"
      ref="cascader"
      v-model="selectedEnvironment"
      placeholder="Search for a cluster"
      class="cluster-selector"
      :class="$style.cascader"
      :options="clusters"
      size="mini"
      :filter-method="filterNode"
      filterable
      @visible-change="onVisibleChanged"
    ></el-cascader>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Cascader, Tooltip } from 'element-ui';
import { IAppEnvironments } from '@/typings/store';
import store from '@/store';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSortDown, faUsers } from '@fortawesome/free-solid-svg-icons';
import { nest } from '@/utils/data-utils';
import { routeToCluster } from '@/utils/region-utils';
import { IClusterRegionSummary } from '@sharedtypes/typings';

interface IClusterNode {
  label: string;
  value: string;
  children: IClusterNode[] | undefined;
}

export default Vue.extend({
  name: 'ClusterSelector',
  components: {
    [Button.name]: Button,
    [Cascader.name]: Cascader,
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  data() {
    return {
      faSortDown,
      faUsers,
      showCascader: false,
    };
  },
  computed: {
    datastoreScope(): string | undefined {
      return store.state.config.currentDatastoreScope;
    },
    currentCluster(): string | undefined {
      return store.state.config.currentCluster;
    },
    availableEnvironments(): IAppEnvironments | undefined {
      return store.state.config.environments;
    },
    currentEnvironment(): string | undefined {
      return this.availableEnvironments
        ? this.availableEnvironments.current.env
        : undefined;
    },
    isProd(): boolean {
      return this.currentEnvironment === 'prod';
    },
    currentRegion(): string | undefined {
      return this.availableEnvironments
        ? this.availableEnvironments.current.region
        : undefined;
    },
    selectedEnvironment: {
      get(): string[] {
        if (
          this.datastoreScope &&
          this.currentCluster &&
          this.availableEnvironments
        ) {
          const { current } = this.availableEnvironments;
          let envRegion = new Array<string>();
          if (current.env !== 'local' && current.region !== 'local') {
            envRegion = [current.env, current.region];
          }

          return [this.datastoreScope, this.currentCluster, ...envRegion];
        }
        return [];
      },
      set(newValue: string[]) {
        if (!this.availableEnvironments) return;
        const [datastoreType, cluster, account, region] = newValue;
        if (this.isLocal) {
          routeToCluster(datastoreType, cluster, 'local', 'local');
        } else {
          routeToCluster(datastoreType, cluster, account, region);
        }
      },
    },
    availableClusters(): IClusterRegionSummary[] {
      return store.state.config.clusters;
    },
    clusters(): IClusterNode[] {
      const clusterMap = nest(this.availableClusters, [
        'type',
        'name',
        'env',
        'region',
      ]);
      const clusterNodes = Object.entries(clusterMap).map(
        ([datastoreName, cluster]) => {
          const datastoreChildren: IClusterNode[] = Object.entries(
            cluster as any,
          ).map(([clusterName, accounts]) => {
            let accountsChildren: IClusterNode[] | undefined;
            if (
              this.currentEnvironment !== 'local' &&
              this.currentRegion !== 'local'
            ) {
              accountsChildren = Object.entries(accounts as any)
                .map(([accountName, regions]) => ({
                  label: accountName.toUpperCase(),
                  value: accountName,
                  children: Object.keys(regions as any).map((region) => ({
                    label: region.toUpperCase(),
                    value: region,
                    children: undefined,
                  })),
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
            }

            return {
              label: clusterName,
              value: clusterName,
              children: accountsChildren,
            } as IClusterNode;
          });

          return {
            label:
              datastoreName.substring(0, 1).toUpperCase() +
              datastoreName.substring(1),
            value: datastoreName,
            children: datastoreChildren,
          };
        },
      );

      return clusterNodes;
    },
    isLocal(): boolean {
      return store.getters.isLocal;
    },
    isSharedCluster(): boolean {
      return store.getters.isSharedCluster;
    },
  },
  methods: {
    filterNode(node: any, keyword: string) {
      return (
        !!node.text && node.text.toLowerCase().includes(keyword.toLowerCase())
      );
    },
    onShowCascader() {
      this.showCascader = true;
      Vue.nextTick(() => {
        const cascader = this.$refs.cascader as any;
        const cascaderEl = cascader.$el as HTMLElement;
        const input = cascaderEl.querySelector('.el-input__inner');
        if (input) {
          (input as HTMLElement).click();
        }
      });
    },
    onVisibleChanged(visible: boolean) {
      if (visible) {
        const cascader = this.$refs.cascader as any;
        const cascaderEl = cascader.$el as HTMLElement;
        const input = cascaderEl.querySelector('.el-input__inner');
        if (input) {
          (input as HTMLElement).focus();
        }
      }
      Vue.nextTick(() => {
        if (!visible) {
          this.showCascader = false;
        }
      });
    },
  },
});
</script>
<style module>
.cascader {
  width: 400px;
}

.clusterLabel {
  font-size: 18px;
  font-weight: bold;
}

.clusterLabel:hover {
  cursor: pointer;
}

.clusterNameLabel {
  color: white;
}

.clusterLocation {
  color: #c5c5c5;
  text-transform: uppercase;
}

.clusterLabel:hover .clusterNameLabel,
.clusterLabel:hover .clusterLocation {
  color: var(--color-action) !important;
}

.environmentLabel.prod {
  color: red;
}

.dropDownTrigger svg {
  color: white;
  vertical-align: top;
}

.sharedClusterIcon {
  color: white;
}
</style>
<style>
.el-cascader-menu {
  height: 400px !important;
  min-width: 200px;
}

.el-cascader-menus {
  height: 400px !important;
}

.el-cascader-menu__wrap {
  height: 400px !important;
}

.el-cascader__suggestion-panel .el-cascader__suggestion-list {
  height: 400px !important;
  max-height: 400px !important;
}
</style>
