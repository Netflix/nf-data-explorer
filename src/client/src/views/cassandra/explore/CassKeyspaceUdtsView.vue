<template>
  <div class="layout horizontal" style="overflow: hidden;">
    <div class="layout vertical flex">
      <v-client-table
        v-loading="tablesLoading"
        :data="udts"
        :columns="tableColumns"
        :options="tableOptions"
        element-loading-text="Fetching UDTs from cluster..."
        class="flex scroll"
      >
        <template slot="name" slot-scope="props">
          <router-link
            :to="{
              name: Routes.CassandraKeyspaceUDTs,
              params: { clusterName, keyspaceName, udtName: props.row.name },
            }"
            >{{ props.row.name }}</router-link
          >
        </template>
      </v-client-table>
    </div>
    <div v-if="selectedUdt" class="flex-2 layout vertical">
      <el-form class="flex padded" style="overflow: hidden;">
        <el-form-item label="Name">
          <el-input v-model="selectedUdt.name" disabled></el-input>
        </el-form-item>
        <el-form-item label="Fields"></el-form-item>
        <el-table :data="selectedUdt.fields" height="100%" class="scroll">
          <el-table-column label="Name" prop="name"> </el-table-column>
          <el-table-column label="Type" prop="type"> </el-table-column>
        </el-table>
      </el-form>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Form, FormItem, Input, Table, TableColumn } from 'element-ui';
import { Routes } from '@/router/routes';
import store from '@/store';
import { IUserDefinedType } from '@cassandratypes/cassandra';
import { ClientTable } from 'vue-tables-2';

Vue.use(ClientTable);

export default Vue.extend({
  name: 'CassKeyspaceUdtsView',
  components: {
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    keyspaceName: {
      type: String,
      required: true,
    },
    udtName: {
      type: String,
    },
  },
  data() {
    return {
      Routes,
      tableOptions: {
        filterByColumn: true,
        perPage: 100,
        headings: {
          name: 'UDT Name',
        },
      },
      tableColumns: ['name'],
      tablesLoading: false,
    };
  },
  computed: {
    udts(): IUserDefinedType[] {
      return store.state.cassandra.explore.keyspaceUDTs;
    },
    selectedUdt(): IUserDefinedType | undefined {
      if (!this.udtName || !this.udts) {
        return undefined;
      }
      return this.udts.find((udt) => udt.name === this.udtName);
    },
  },
});
</script>
