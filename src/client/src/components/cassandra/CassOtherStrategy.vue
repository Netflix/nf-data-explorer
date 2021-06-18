<template>
  <div class="padded">
    <el-form label-width="130px">
      <el-form-item label="Strategy">
        <el-input
          :value="strategy"
          :class="$style['strategy-input']"
          disabled
        ></el-input>
      </el-form-item>
      <el-form-item label="Strategy Options">
        <el-input
          :value="JSON.stringify(strategyOptions)"
          :class="$style['strategy-input']"
          disabled
        ></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Form, FormItem, Input } from 'element-ui';
import { Prop } from 'vue/types/options';
import { IKeyspaceStrategyOptions } from '@cassandratypes/cassandra';

export default Vue.extend({
  name: 'CassOtherStrategy',
  components: {
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
  },
  props: {
    disableRacks: {
      type: Boolean,
    },
    strategy: {
      type: String,
    },
    strategyOptions: {
      type: Object as Prop<IKeyspaceStrategyOptions>,
    },
    disabled: {
      type: Boolean,
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
