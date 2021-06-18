<template>
  <div
    v-loading="isLoading"
    :class="$style.adminView"
    class="full-height layout vertical"
    element-loading-text="Loading Application Status..."
  >
    <el-form class="spacer__top padded" inline>
      <el-form-item label="Current Environment">
        <el-input :value="currentEnv" disabled></el-input>
      </el-form-item>
      <el-form-item label="Current Region">
        <el-input :value="currentRegion" disabled></el-input>
      </el-form-item>
      <el-form-item label="Discovery Status">
        <el-input :value="discoveryStatus" disabled></el-input>
      </el-form-item>
      <el-form-item label="ACL Status">
        <el-input :value="aclStatus" disabled></el-input>
      </el-form-item>
    </el-form>

    <el-tabs v-model="selectedTab" type="border-card">
      <el-tab-pane
        :name="TabNames.DiscoveredClusters"
        label="Discovered Clusters"
      >
      </el-tab-pane>
      <el-tab-pane :name="TabNames.Nodes" label="Nodes"> </el-tab-pane>
      <el-tab-pane :name="TabNames.ClusterAcls" label="Cluster ACLs">
      </el-tab-pane>
      <el-tab-pane :name="TabNames.EntityAcls" label="Entity ACLs">
      </el-tab-pane>
      <el-tab-pane :name="TabNames.Users" label="Users"> </el-tab-pane>
    </el-tabs>

    <!-- using v-show instead of v-if here due to v-client-table column filters not re-rendering properly -->

    <v-client-table
      v-show="selectedTab === TabNames.DiscoveredClusters"
      :data="discoveredClusters"
      :columns="discoveredClustersTableColumns"
      :options="discoveredClustersTableOptions"
      class="flex scroll"
    >
      <template slot="hasConnection" slot-scope="props">
        {{ props.row.hasConnection }}
      </template>
    </v-client-table>

    <v-client-table
      v-show="selectedTab === TabNames.Nodes"
      :data="nodes"
      :columns="nodesTableColumns"
      :options="nodesTableOptions"
      class="flex scroll"
    >
      <template slot="hasConnection" slot-scope="props">
        {{ props.row.hasConnection }}
      </template>
    </v-client-table>

    <v-client-table
      v-show="selectedTab === TabNames.ClusterAcls"
      :data="clusterAcls"
      :columns="aclTableColumns"
      :options="aclTableOptions"
      class="flex scroll"
    >
      <template slot="isShared" slot-scope="props">
        {{ props.row.isShared }}
      </template>
      <template slot="owners" slot-scope="props">
        {{ props.row.owners.join(', ') }}
      </template>
    </v-client-table>

    <div v-show="selectedTab === TabNames.EntityAcls" class="toolbar">
      <el-button type="primary" @click="fetchData(true)"
        >Force Cache Refresh</el-button
      >
    </div>
    <v-client-table
      v-show="selectedTab === TabNames.EntityAcls"
      :data="entityAcls"
      :columns="entityAclsTableColumns"
      :options="entityAclsTableOptions"
      class="flex scroll"
    >
      <template slot="owners" slot-scope="props">
        {{ props.row.owners.join(', ') }}
      </template>
    </v-client-table>

    <div v-show="selectedTab === TabNames.Users" class="layout horizontal flex">
      <v-client-table
        :data="users"
        :columns="userTableColumns"
        :options="userTableOptions"
        class="flex scroll"
        @row-click="onSelectUser"
      >
      </v-client-table>
      <v-client-table
        :data="selectedGroups"
        :columns="userGroupsColumns"
        :options="userGroupsOptions"
        class="flex-2 scroll"
      >
      </v-client-table>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Form, FormItem, Input, Tabs, TabPane } from 'element-ui';
import { getAdminStatus } from '@/services/AdminService';
import { IAdminStatus, IEntityOwnership } from '@sharedtypes/typings';
import { ClientTable } from 'vue-tables-2';

Vue.use(ClientTable);

enum TabNames {
  DiscoveredClusters = 'DiscoveredClusters',
  Nodes = 'Nodes',
  ClusterAcls = 'ClusterAcls',
  EntityAcls = 'EntityAcls',
  Users = 'Users',
}

export default Vue.extend({
  name: 'AdminView',
  components: {
    [Button.name]: Button,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [Tabs.name]: Tabs,
    [TabPane.name]: TabPane,
  },
  data() {
    return {
      TabNames,
      isLoading: false,
      selectedTab: TabNames.DiscoveredClusters,
      adminStatus: undefined as IAdminStatus | undefined,
      // discovered clusters table
      discoveredClustersTableColumns: [
        'datastoreType',
        'name',
        'env',
        'region',
        'hasConnection',
      ],
      discoveredClustersTableOptions: {
        filterByColumn: true,
        perPage: 100,
        headings: {
          datastoreType: 'Datastore type',
          hasConnection: 'Connected?',
        },
      },
      // nodes table
      nodesTableColumns: [
        'datastoreType',
        'name',
        'env',
        'region',
        'ip',
        'status',
        'hasConnection',
      ],
      nodesTableOptions: {
        filterByColumn: true,
        perPage: 100,
        headings: {
          datastoreType: 'Datastore type',
          hasConnection: 'Connected?',
        },
      },
      // ACL table
      aclTableColumns: ['name', 'isShared', 'owners'],
      aclTableOptions: {
        filterByColumn: true,
        perPage: 100,
        headings: {
          name: 'Cluster Name',
          isShared: 'Shared',
        },
      },
      // Entity ACLs table
      entityAclsTableColumns: ['clusterName', 'type', 'name', 'owners'],
      entityAclsTableOptions: {
        filterByColumn: true,
        perPage: 100,
        headings: {
          clusterName: 'Cluster Name',
        },
      },
      // Users table
      userTableColumns: ['email'],
      userTableOptions: {
        filterByColumn: true,
        perPage: 100,
      },
      // User Groups table
      selectedGroups: [],
      userGroupsColumns: ['group'],
      userGroupsOptions: {
        filterByColumn: true,
        perPage: 100,
      },
    };
  },
  computed: {
    discoveredClusters(): any[] {
      if (!this.adminStatus) return [];
      return ([
        ...Object.values(this.adminStatus.available.clusters),
      ] as any).flat();
    },
    clusterAcls(): any[] {
      if (!this.adminStatus) return [];
      return Object.values(this.adminStatus.acl);
    },
    entityAcls(): IEntityOwnership[] {
      if (!this.adminStatus) return [];
      return Object.values(this.adminStatus.cache);
    },
    users(): any[] {
      if (!this.adminStatus) return [];
      return this.adminStatus.userCache;
    },
    currentEnv(): string {
      if (!this.adminStatus) return 'N/A';
      return this.adminStatus.currentEnv;
    },
    currentRegion(): string {
      if (!this.adminStatus) return 'N/A';
      return this.adminStatus.currentRegion;
    },
    discoveryStatus(): 'success' | 'failure' | 'N/A' {
      if (!this.adminStatus) return 'N/A';
      return this.adminStatus.state.discovery;
    },
    aclStatus(): 'success' | 'failure' | 'N/A' {
      if (!this.adminStatus) return 'N/A';
      return this.adminStatus.state.acl;
    },
    nodes(): any[] {
      if (!this.adminStatus) return [];
      return Object.entries(this.adminStatus.available.clusters).reduce(
        (prev, [type, clusters]) => {
          clusters.forEach((cluster) => {
            const { name, env, region, hasConnection, instances } = cluster;
            instances.forEach(({ ip, status }) => {
              prev.push({
                datastoreType: type,
                name,
                env,
                region,
                hasConnection,
                ip,
                status,
              });
            });
          });
          return prev;
        },
        new Array<{
          datastoreType: string;
          name: string;
          env: string;
          region: string;
          hasConnection: boolean;
          ip: string;
          status: 'UP' | 'DOWN';
        }>(),
      );
    },
  },
  created() {
    this.fetchData(false);
  },
  methods: {
    async fetchData(refresh: boolean) {
      try {
        this.isLoading = true;
        this.adminStatus = Object.freeze(await getAdminStatus(refresh));
      } finally {
        this.isLoading = false;
      }
    },
    onSelectUser(props) {
      const row = props.row;
      this.selectedGroups = row.groups.sort().map((group) => ({
        group,
      }));
    },
  },
});
</script>
<style module>
.adminView :global .el-tabs__item {
  user-select: none;
}
</style>
