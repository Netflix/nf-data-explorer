<template>
  <div class="padded">
    <el-form label-width="90px">
      <el-form-item label="Strategy">
        <el-input
          value="Network Topology Strategy"
          :class="$style['strategy-input']"
          disabled
        ></el-input>
      </el-form-item>
      <el-form-item label="Datacenters">
        <div class="layout horizontal center">
          <div
            v-for="datacenter of datacentersModel"
            :key="datacenter.name"
            :class="$style['strategy-option']"
            class="layout horizontal center"
          >
            <el-checkbox
              v-model="datacenter.selected"
              :label="datacenter.name"
              class="spacer__left"
              :disabled="disabled"
            ></el-checkbox>
            <el-input
              v-model="datacenter.racks"
              :class="$style.input"
              class="spacer__left spacer__right"
              disabled
            ></el-input>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Checkbox, Form, FormItem, Input } from 'element-ui';
import { Prop } from 'vue/types/options';
import {
  IKeyspaceStrategyOptions,
  IDatacenter,
} from '@cassandratypes/cassandra';

export default Vue.extend({
  name: 'CassNetworkTopologyStrategy',
  components: {
    [Checkbox.name]: Checkbox,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
  },
  props: {
    disableRacks: {
      type: Boolean,
    },
    strategyOptions: {
      type: Object as Prop<IKeyspaceStrategyOptions>,
    },
    datacenters: {
      type: Array as Prop<IDatacenter[]>,
    },
    disabled: {
      type: Boolean,
    },
  },
  computed: {
    datacentersModel(): any[] {
      return this.datacenters.map((dc) => {
        const racks = parseInt(this.strategyOptions[dc.name], 10);
        return {
          name: dc.name,
          selected: racks > 0,
          racks: isNaN(racks) ? '' : racks,
        };
      });
    },
  },
});
</script>
<style module>
.strategy-input {
  max-width: 445px;
}

.strategy-option + .strategy-option {
  margin-left: var(--spacer-standard);
}

.input {
  width: 50px;
}
</style>
