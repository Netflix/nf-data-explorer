<template>
  <div
    :class="$style['cass-create-table-compaction-page']"
    class="layout horizontal"
  >
    <section
      v-for="strategy in compactionStrategies"
      :key="strategy.name"
      :class="$style.section"
      :disabled="strategy.disabled"
      class="bordered flex spacer layout vertical"
    >
      <div class="toolbar layout horizontal justified">
        <div>
          <font-awesome-icon
            :icon="strategy.icon"
            class="spacer__right"
            fixed-width
          ></font-awesome-icon>
          {{ strategy.name }}
        </div>
        <el-checkbox-button
          v-show="!strategy.disabled"
          v-model="strategyMap[strategy.name]"
          :label="strategy.name"
          @change="onSelectStrategy"
        >
          <font-awesome-icon
            v-if="strategyMap[strategy.name]"
            :icon="faCheckSquare"
            fixed-width
          ></font-awesome-icon>
          <font-awesome-icon
            v-else
            :icon="faSquare"
            fixed-width
          ></font-awesome-icon>
          <span> Strategy</span>
        </el-checkbox-button>
      </div>

      <div class="content flex scroll" :class="$style.content">
        <el-alert
          v-if="strategy.disabled"
          type="warning"
          title="Strategy not available on the current Cassandra version."
          class="mt-2"
          show-icon
          :closable="false"
        ></el-alert>

        <h4 v-if="strategy.pros.length > 0">Recommended for:</h4>
        <div v-for="pro in strategy.pros" :key="pro" :class="$style.pro">
          <font-awesome-icon :icon="faCheck" fixed-width></font-awesome-icon>
          <span> {{ pro }}</span>
        </div>

        <h4 v-if="strategy.cons.length > 0">Not recommended for:</h4>
        <div v-for="con in strategy.cons" :key="con" :class="$style.con">
          <font-awesome-icon :icon="faTimes" fixed-width></font-awesome-icon>
          <span> {{ con }}</span>
        </div>

        <h4>
          <font-awesome-icon :icon="faCog" fixed-width></font-awesome-icon>
          Settings:
        </h4>
        <el-form class="spacer__top" label-width="150px">
          <el-form-item
            v-for="option in strategy.options"
            :key="option.id"
            :label="option.label"
          >
            <el-select
              v-if="option.multiValue && option.multiValue.length > 0"
              v-model="option.value"
              :disabled="selectedStrategyName !== strategy.name"
            >
              <el-option
                v-for="optionValue in option.multiValue"
                :key="optionValue"
                :label="optionValue"
                :value="optionValue"
              ></el-option>
            </el-select>

            <el-input-number
              v-else-if="option.type === 'number'"
              v-model.number="option.value"
              controls-position="right"
              :disabled="selectedStrategyName !== strategy.name"
            ></el-input-number>

            <el-input
              v-else
              v-model="option.value"
              :disabled="selectedStrategyName !== strategy.name"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
    </section>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import {
  Alert,
  Button,
  Checkbox,
  CheckboxButton,
  Form,
  FormItem,
  Input,
  InputNumber,
  Option,
  Select,
} from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCheck,
  faCheckSquare,
  faCog,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { faSquare } from '@fortawesome/free-regular-svg-icons';
import {
  getCompactionStrategies,
  ICompactionStrategy,
} from './compaction-strategies';
import {
  ICreateTableOptions,
  ICompactionOptions,
} from '@cassandratypes/cassandra';
import debounce from 'lodash.debounce';
import { IValidationResult } from '@/typings/validation';
import store from '@/store';

interface ICompactionStrategyDisplay extends ICompactionStrategy {
  disabled: boolean;
}

export default Vue.extend({
  name: 'CassCreateTableCompactionPage',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [CheckboxButton.name]: CheckboxButton,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [InputNumber.name]: InputNumber,
    [Option.name]: Option,
    [Select.name]: Select,
    FontAwesomeIcon,
  },
  props: {
    value: {
      type: Object as Prop<ICreateTableOptions>,
      required: true,
    },
  },
  data() {
    // extract the default compaction strategy from the given value.
    const compactionProp: ICompactionOptions | undefined = this.value.options
      .compaction;

    const compactionStrategies = getCompactionStrategies();

    const defaultSelectedStrategy = compactionProp
      ? compactionProp.class
      : undefined;
    const strategyMap = compactionStrategies.reduce(
      (memo, strategy) => ({
        ...memo,
        [strategy.name]: strategy.value === defaultSelectedStrategy,
      }),
      {} as {
        [strategyName: string]: boolean;
      },
    );

    if (compactionProp) {
      const strategy = compactionStrategies.find(
        (strategy) => strategy.value === defaultSelectedStrategy,
      );
      if (strategy && compactionProp.options) {
        for (const [optionName, optionValue] of Object.entries(
          compactionProp.options,
        )) {
          const item = strategy.options.find(
            (option) => option.id === optionName,
          );
          if (item) {
            item.value = optionValue;
          }
        }
      }
    }

    return {
      faCheck,
      faCheckSquare,
      faCog,
      faSquare,
      faTimes,
      strategyMap,
      checked: [],
    };
  },
  computed: {
    // we use checkboxes for the different strategies, but we need to simulate radio button functionality.
    // here we map a selected compaction strategy name to the strategy map which is bound as the model to the checkboxes.
    selectedStrategyName: {
      get(): string | undefined {
        for (const [name, value] of Object.entries(this.strategyMap)) {
          if (value) {
            return name;
          }
        }
        return undefined;
      },
      set(value: string | undefined) {
        for (const key of Object.keys(this.strategyMap)) {
          this.strategyMap[key] = key === value;
        }
      },
    },
    compactionStrategies(): ICompactionStrategyDisplay[] {
      const { info } = store.state.cassandra.cluster;
      if (!info) {
        return [];
      }
      return getCompactionStrategies().map((strategy) => {
        const { versionRegex } = strategy;
        return {
          ...strategy,
          disabled: !!versionRegex && !versionRegex.test(info.version),
        };
      });
    },
  },
  watch: {
    compactionStrategies: {
      deep: true,
      handler() {
        this.updateStrategy();
      },
    },
  },
  created() {
    this.updateStrategy = debounce(this.updateStrategy, 100);
  },
  methods: {
    onSelectStrategy(value, e) {
      if (value) {
        this.selectedStrategyName = e.target.value;
        this.updateStrategy();
      }
    },
    updateStrategy() {
      const selectedStrategy = this.compactionStrategies.find(
        (strategy) => strategy.name === this.selectedStrategyName,
      );
      if (selectedStrategy) {
        const compactionOptions: ICompactionOptions = {
          class: selectedStrategy.value,
          options: selectedStrategy.options.reduce((memo, curr) => {
            memo[curr.id] = curr.value;
            return memo;
          }, {}) as any,
        };
        this.value.options.compaction = compactionOptions;

        // speculative retries aren't compatible with TWCS
        if (selectedStrategy.value === 'TimeWindowCompactionStrategy') {
          this.value.options.speculativeRetry = 'NONE';
        }
      }
      this.$emit('change', this.value);
    },
    async validate(): Promise<IValidationResult> {
      const isValid = Object.values(this.strategyMap).some(
        (selected) => selected,
      );
      return {
        isValid,
        message: !isValid ? 'Please select a compaction strategy.' : undefined,
      };
    },
  },
});
</script>
<style module>
.content {
  padding: 0 var(--spacer-large);
}

.pro,
.con {
  margin-left: var(--spacer-standard);
  line-height: 1.9em;
}

.cass-create-table-compaction-page
  :global
  .el-checkbox-button:last-child
  .el-checkbox-button__inner {
  border-radius: 0;
}
</style>
