<template>
  <el-dialog
    ref="dialog"
    title="Create New Keyspace"
    :class="$style.cassCreateKeyspaceView"
    class="dialog"
    :close-on-click-modal="false"
    visible
    @close="onClose"
  >
    <el-form
      ref="form"
      v-loading="createInProgress"
      label-width="200px"
      label-position="top"
      :model="model"
      :rules="rules"
      element-loading-text="Creating new keyspace..."
    >
      <div :class="$style.instructions">
        Create a new namespace to group your tables.
      </div>

      <el-form-item label="Keyspace Name" prop="name">
        <el-input ref="keyspaceNameInput" v-model="model.name"></el-input>
      </el-form-item>

      <div :class="$style.instructions">
        Choose the regions this keyspace should be replicated to. This keyspace
        will be configured with the recommended number of racks per datacenter
        to support rack fail over and system maintenance.
      </div>

      <el-form-item label="Replication" prop="replication">
        <el-checkbox-group v-model="model.replication">
          <el-checkbox
            v-for="(datacenter, index) in datacenters"
            :key="index"
            :class="$style.regionCheckbox"
            :label="datacenter.region"
          >
            <label>{{ datacenter.region }}</label>
            <el-input
              v-model.number="datacenter.replication"
              disabled
            ></el-input>
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <div v-if="isSharedCluster" :class="$style.instructions">
        Since <strong>{{ clusterName }}</strong> is a shared cluster, ownership
        information is required for new keyspaces. Search for a Group or User
        below (groups are recommended).
      </div>

      <el-form-item v-if="isSharedCluster" label="Owner" prop="owner">
        <email-selector v-model="model.owner"></email-selector>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="createInProgress" @click="onClose()"
        >Cancel</el-button
      >
      <el-button :disabled="createInProgress" type="primary" @click="onCreate()"
        >Create</el-button
      >
    </span>
  </el-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  Button,
  CheckboxGroup,
  Checkbox,
  Dialog,
  Form,
  FormItem,
  Input,
} from 'element-ui';
import { Routes } from '@/router/routes';
import { createKeyspace } from '@/services/cassandra/CassService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import store from '@/store';
import { IKeyspaceReplication } from '@cassandratypes/cassandra';

export default Vue.extend({
  name: 'CassCreateKeyspaceView',
  components: {
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [CheckboxGroup.name]: CheckboxGroup,
    [Dialog.name]: Dialog,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      createInProgress: false,
      model: {
        name: '',
        replication: store.state.cassandra.cluster.datacenters.map(
          (dc) => dc.name,
        ),
        owner: '',
      },
    };
  },
  computed: {
    datacenters(): any[] {
      return store.state.cassandra.cluster.datacenters.map((dc) => ({
        region: dc.name,
        replication: dc.racks.length,
      }));
    },
    keyspaceNames(): Set<string> {
      return new Set(
        store.state.cassandra.cluster.keyspaces.map((table) =>
          table.name.toLowerCase(),
        ),
      );
    },
    isSharedCluster(): boolean {
      return store.getters.isSharedCluster;
    },
    rules(): any {
      const duplicateNameValidator = (
        _rule,
        value: string,
        cb: (error?: Error) => void,
      ) => {
        if (this.keyspaceNames.has(value.toLowerCase())) {
          return cb(new Error('Keyspace already exists'));
        }
        cb();
      };
      return {
        name: [
          { required: true, message: 'Keyspace name is required' },
          {
            validator: duplicateNameValidator,
            message: 'A keyspace already exists with the specified name.',
          },
          {
            pattern: /^[\w]*$/,
            message:
              'Keyspace names can only include alphanumeric and underscore characters.',
          },
        ],
        owner: [{ required: true, message: 'A user or group is required' }],
        replication: [
          { required: true, message: 'At least one region is required' },
        ],
      };
    },
    keyspaceReplication(): IKeyspaceReplication {
      return this.model.replication.reduce((datacenterMap, curr) => {
        const dc = this.datacenters.find(
          (datacenter) => datacenter.region === curr,
        );
        return {
          ...datacenterMap,
          [curr]: dc ? dc.replication : undefined,
        };
      }, {});
    },
  },
  mounted() {
    Vue.nextTick(() => {
      (this.$refs.keyspaceNameInput as any).focus();
    });
  },
  methods: {
    onClose() {
      this.$router.push({
        name: Routes.CassandraKeyspaces,
        params: {
          clusterName: this.clusterName,
        },
      });
    },
    async onCreate() {
      if (!(await (this.$refs.form as any).validate())) {
        return;
      }
      this.createInProgress = true;
      try {
        await createKeyspace(
          this.clusterName,
          this.model.name,
          this.keyspaceReplication,
          [this.model.owner],
        );
        this.createInProgress = false;
        (this.$refs.dialog as any).close();

        // redirect to the new keyspace
        this.$router.replace({
          name: Routes.CassandraKeyspace,
          params: {
            keyspaceName: this.model.name,
          },
        });
        notify(
          NotificationType.Success,
          'Created New Keyspace',
          `${this.model.name} created successfully.`,
        );
      } catch (err) {
        this.createInProgress = false;
        notify(
          NotificationType.Error,
          'Failed to Create Keyspace',
          err.message,
        );
      }
    },
  },
});
</script>
<style module>
.cassCreateKeyspaceView :global .el-dialog__body {
  padding-top: 10px;
  padding-bottom: 0;
}

.cassCreateKeyspaceView h4 {
  margin-top: 30px;
}

.instructions {
  margin-bottom: 10px;
  margin-top: 20px;
}

.regionCheckbox input {
  width: 50px;
  margin-left: 10px;
}
</style>
