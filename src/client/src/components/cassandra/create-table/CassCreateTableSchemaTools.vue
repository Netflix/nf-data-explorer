<template>
  <div
    :class="$style['cass-create-table-schema-tools']"
    class="layout vertical"
  >
    <el-collapse v-model="activeNames">
      <el-collapse-item name="1">
        <template slot="title">
          <font-awesome-icon
            :icon="faToolbox"
            class="spacer__right"
            fixed-width
          ></font-awesome-icon
          >Tools
        </template>

        <div class="layout horizontal full-height">
          <el-menu
            class="full-height"
            :default-active="selectedView"
            :collapse="false"
            menu-trigger="click"
            unique-opened
            @select="selectedView = $event"
          >
            <el-menu-item index="preview">
              <font-awesome-icon
                :icon="faTerminal"
                fixed-width
              ></font-awesome-icon>
              <span slot="title">CQL Statement</span>
            </el-menu-item>
            <el-menu-item index="storage">
              <font-awesome-icon :icon="faHdd" fixed-width></font-awesome-icon>
              <span slot="title">Storage Layout</span>
            </el-menu-item>
            <el-menu-item index="queries">
              <font-awesome-icon
                :icon="faSearch"
                fixed-width
              ></font-awesome-icon>
              <span slot="title">Sample Queries</span>
            </el-menu-item>
          </el-menu>

          <div v-if="previewError" class="flex padded">
            <el-alert title="Error" type="error" :closable="false" show-icon>
              {{ previewError }}
            </el-alert>
          </div>
          <div v-else-if="hasPartitionKeys" class="flex full-height">
            <cass-create-table-statement-preview
              v-if="selectedView === 'preview'"
              v-loading="previewLoading"
              class="full-height"
              :value="statement"
              el-loading-text="Loading CQL Statement..."
              readonly
            ></cass-create-table-statement-preview>

            <cass-create-table-storage-layout
              v-if="selectedView === 'storage'"
              :partition-keys="value.partitionColumns"
              :clustering-keys="value.clusteringColumns"
              :static-columns="value.staticColumns"
              class="flex scroll full-height"
            ></cass-create-table-storage-layout>

            <div
              v-if="selectedView === 'queries'"
              class="full-height scroll padded"
            >
              <cass-sample-query
                v-for="(query, index) in sampleQueries"
                :key="index"
                :class="$style.query"
                class="padded"
                :query="query"
              ></cass-sample-query>
            </div>
          </div>
          <div v-else class="flex padded">
            <el-alert
              title="No partition keys defined"
              type="info"
              :closable="false"
              show-icon
            >
            </el-alert>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faHdd,
  faSearch,
  faTerminal,
  faToolbox,
} from '@fortawesome/free-solid-svg-icons';
import { Alert, Collapse, CollapseItem, Menu, MenuItem } from 'element-ui';
import CassCreateTableStatementPreview from '@/components/cassandra/create-table/CassCreateTableStatementPreview.vue';
import CassCreateTableStorageLayout from '@/components/cassandra/create-table/CassCreateTableStorageLayout.vue';
import CassSampleQuery from '@/components/cassandra/CassSampleQuery.vue';
import { ICreateTableOptions } from '@cassandratypes/cassandra';
import { generateSampleQueries } from '@/utils/cassandra-utils';

export default Vue.extend({
  name: 'CassCreateTableSchemaTools',
  components: {
    [Alert.name]: Alert,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    [Menu.name]: Menu,
    [MenuItem.name]: MenuItem,
    CassCreateTableStatementPreview,
    CassCreateTableStorageLayout,
    CassSampleQuery,
    FontAwesomeIcon,
  },
  props: {
    value: {
      type: Object as Prop<ICreateTableOptions>,
      required: true,
    },
    previewStatement: {
      type: String,
    },
    previewLoading: {
      type: Boolean,
    },
    previewError: {
      type: String,
    },
    expanded: {
      type: Boolean,
    },
  },
  data() {
    return {
      faHdd,
      faSearch,
      faTerminal,
      faToolbox,
      selectedView: 'preview',
      activeNames: this.expanded ? ['1'] : new Array<string>(),
      statement: this.previewStatement,
    };
  },
  computed: {
    keyspaceName(): string {
      return this.$route.params.keyspaceName;
    },
    hasPartitionKeys(): boolean {
      return this.value.partitionColumns.length > 0;
    },
    sampleQueries(): string[] {
      return generateSampleQueries(
        this.keyspaceName,
        this.value.table,
        this.value.partitionColumns.map((col) => col.name),
        this.value.clusteringColumns.map((col) => col.name),
      );
    },
  },
  watch: {
    expanded(expand) {
      this.activeNames = expand ? ['1'] : [];
    },
    previewStatement(value) {
      this.statement = value;
    },
  },
});
</script>
<style module>
.cass-create-table-schema-tools :global .el-collapse-item__header {
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.cass-create-table-schema-tools :global .el-collapse-item__header.is-active {
  border: 1px solid var(--color-border);
}

.cass-create-table-schema-tools :global .el-collapse-item__wrap {
  clear: left;
}

.cass-create-table-schema-tools :global .el-collapse-item__content {
  height: 165px;
  padding-bottom: 0;
}

.cass-create-table-schema-tools :global .el-collapse-item__arrow {
  float: left;
  margin-left: var(--spacer-standard);
}
</style>
