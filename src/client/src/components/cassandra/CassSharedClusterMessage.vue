<template>
  <div>
    <!-- cluster view -->
    <div v-if="isCluster">
      <el-alert
        v-if="isSharedCluster"
        type="info"
        :title="$t('cassandra.keyspaces.sharedCluster.title')"
        show-icon
      >
        <i18n path="cassandra.keyspaces.sharedCluster.message" tag="p">
          <a
            :href="
              $t('cassandra.keyspaces.sharedCluster.link.href', {
                cluster: clusterName.toLowerCase(),
                env: currentEnvironment,
                region: currentRegion,
              })
            "
            target="_blank"
            >{{ $t('cassandra.keyspaces.sharedCluster.link.label') }}</a
          >
        </i18n>
      </el-alert>
    </div>

    <!-- keyspace -->
    <div v-if="isKeyspace">
      <el-alert
        type="warning"
        :title="
          isKeyspaceNotFound ? 'Keyspace Not Found' : keyspaceError.message
        "
        show-icon
      >
        <div v-if="isKeyspaceNotFound">
          A keyspace with the name "<strong>{{ keyspaceName }}</strong
          >" could not be found.
        </div>
        <!-- eslint-disable vue/no-v-html -->
        <div v-else v-html="keyspaceError.remediation"></div>
        <!-- eslint-enable vue/no-v-html -->
        <router-link
          class="block mt-2"
          :to="{ name: Routes.CassandraKeyspaces, params: { clusterName } }"
          >View all keyspaces.</router-link
        >
      </el-alert>
    </div>

    <!-- table view -->
    <template v-if="isTable">
      <el-alert type="warning" title="Table Not Found" show-icon>
        <div>
          A table with the name "<strong>{{ tableName }}</strong
          >" could not be found.
          <router-link
            :to="{
              name: Routes.CassandraKeyspace,
              params: { clusterName, keyspaceName },
            }"
            >View all tables in this keyspace.</router-link
          >
          <div v-if="isSharedCluster" class="mt-2">
            <i18n
              path="cassandra.tables.sharedCluster.tableNotFound.message"
              tag="div"
            >
              <a
                :href="
                  $t('cassandra.tables.sharedCluster.tableNotFound.link.href', {
                    cluster: clusterName,
                    env: currentEnvironment,
                    region: currentRegion,
                  })
                "
                target="_blank"
                >{{
                  $t('cassandra.tables.sharedCluster.tableNotFound.link.label')
                }}</a
              >
            </i18n>
          </div>
        </div>
      </el-alert>
    </template>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { Alert } from 'element-ui';
import store from '@/store';
import { Routes } from '@/router/routes';
import { IAppEnvironments } from '@/typings/store';
import HttpStatusError from '@/models/errors/HttpStatusError';

export default Vue.extend({
  name: 'CassSharedClusterMessage',
  components: {
    [Alert.name]: Alert,
  },
  props: {
    type: {
      type: String as Prop<'cluster' | 'keyspace' | 'table'>,
      required: true,
      validator: (value: string) => {
        return ['cluster', 'keyspace', 'table'].includes(value);
      },
    },
    clusterName: {
      type: String,
      required: true,
    },
    keyspaceName: {
      type: String,
    },
    tableName: {
      type: String,
    },
  },
  data() {
    return {
      Routes,
    };
  },
  computed: {
    availableEnvironments(): IAppEnvironments | undefined {
      return store.state.config.environments;
    },
    currentEnvironment(): string | undefined {
      return this.availableEnvironments
        ? this.availableEnvironments.current.env
        : undefined;
    },
    currentRegion(): string | undefined {
      return this.availableEnvironments
        ? this.availableEnvironments.current.region
        : undefined;
    },
    isCluster(): boolean {
      return this.type === 'cluster';
    },
    isKeyspace(): boolean {
      return this.type === 'keyspace';
    },
    isTable(): boolean {
      return this.type === 'table';
    },
    isSharedCluster(): boolean {
      return store.getters.isSharedCluster;
    },
    keyspaceError(): HttpStatusError | undefined {
      return store.state.cassandra.explore.keyspaceError;
    },
    isKeyspaceNotFound(): boolean {
      return !!this.keyspaceError && this.keyspaceError.status === 404;
    },
  },
});
</script>
