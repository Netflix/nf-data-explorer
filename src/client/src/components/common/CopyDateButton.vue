<template>
  <div ref="container" :class="$style.copyDateButton">
    <el-dropdown :class="$style.dropdown" trigger="click" @command="onCommand">
      <el-button type="text">
        <font-awesome-icon :icon="faCopy" />
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          v-for="item in copyOptions"
          :key="item.command"
          :command="item.command"
        >
          <font-awesome-icon :icon="item.icon" fixed-width></font-awesome-icon>
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from 'element-ui';
import {
  faClock,
  faCopy,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { copyToClipboard } from '@/utils/clipboard-utils';
import { dateTimeAndDistanceFilter } from '@/filters';
import { PropValidator } from 'vue/types/options';

enum Commands {
  CopyUser,
  CopyUtc,
}

export default Vue.extend({
  name: 'CopyDateButton',
  components: {
    [Button.name]: Button,
    [Dropdown.name]: Dropdown,
    [DropdownMenu.name]: DropdownMenu,
    [DropdownItem.name]: DropdownItem,
    FontAwesomeIcon,
  },
  props: {
    value: {
      type: [Date, Number],
      required: true,
    } as PropValidator<Date | number>,
  },
  data() {
    return {
      faClock,
      faCopy,
      faStopwatch,
      Commands,
      copyOptions: [
        {
          command: Commands.CopyUtc,
          icon: faStopwatch,
          label: 'Copy UTC timestamp',
        },
        {
          command: Commands.CopyUser,
          icon: faClock,
          label: 'Copy formatted date',
        },
      ],
    };
  },
  methods: {
    onCommand(command: Commands): void {
      const date =
        this.value instanceof Date ? this.value : new Date(this.value);

      let formattedValue;
      switch (command) {
        case Commands.CopyUser:
          formattedValue = dateTimeAndDistanceFilter(date);
          break;

        case Commands.CopyUtc:
          formattedValue = `${this.value}`;
          break;

        default:
          throw new Error(`Unsupported command: ${command}`);
      }

      copyToClipboard(
        formattedValue,
        this.$refs.container as HTMLElement,
        true,
      );
    },
  },
});
</script>
<style module>
.copyDateButton {
  display: inline-block;
  margin-left: 10px;
}
</style>
