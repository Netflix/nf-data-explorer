<template>
  <el-dropdown trigger="click" @command="onCommand">
    <el-button type="text" size="mini" :disabled="availableActions.length === 0"
      >Actions
      <i class="el-icon-arrow-down el-icon--right"></i>
    </el-button>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        v-for="action in availableActions"
        :key="action.command"
        :command="action.command"
      >
        <font-awesome-icon
          :icon="action.icon"
          :class="{ [$style.destructiveIcon]: action.isDestructive }"
          fixed-width
        ></font-awesome-icon>
        {{ action.label }}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from 'element-ui';
import { faEraser, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IRegionInfo } from '@sharedtypes/typings';
import store from '@/store';
import { Routes } from '@/router/routes';
import { ICassandraFeatureMap } from '@cassandratypes/cassandra';
import { hasFeature } from '@/utils/feature-utils';

interface ITableAction {
  command: string;
  icon: any;
  isDestructive: boolean;
  label: string;
  requiresFeature: keyof ICassandraFeatureMap | undefined;
}

export default Vue.extend({
  name: 'CassTableActions',
  components: {
    [Button.name]: Button,
    [Dropdown.name]: Dropdown,
    [DropdownMenu.name]: DropdownMenu,
    [DropdownItem.name]: DropdownItem,
    FontAwesomeIcon,
  },
  data() {
    return {
      actions: [
        {
          command: 'drop',
          icon: faTrashAlt,
          label: 'Drop Table',
          isDestructive: true,
          requiresFeature: 'allowDrop',
        },
        {
          command: 'truncate',
          icon: faEraser,
          label: 'Truncate Table',
          isDestructive: true,
          requiresFeature: 'allowTruncate',
        },
      ] as ITableAction[],
    };
  },
  computed: {
    currentEnv(): IRegionInfo | undefined {
      const { environments } = store.state.config;
      if (environments) {
        return environments.current;
      }
      return undefined;
    },
    isDestructiveOperationAllowed(): boolean {
      if (!this.currentEnv) return false;
      return store.state.cassandra.features.envsAllowingDestructiveOperations.includes(
        this.currentEnv.env,
      );
    },
    availableActions(): ITableAction[] {
      return this.actions.filter((action) => {
        if (
          action.requiresFeature &&
          !hasFeature(store, action.requiresFeature)
        ) {
          return false;
        }

        if (action.isDestructive && !this.isDestructiveOperationAllowed) {
          return false;
        }

        return true;
      });
    },
  },
  methods: {
    onCommand(command) {
      switch (command) {
        case 'drop':
          this.$router.push({
            name: Routes.CassandraTableDrop,
            params: this.$route.params,
          });
          break;
        case 'truncate':
          this.$router.push({
            name: Routes.CassandraTableTruncate,
            params: this.$route.params,
          });
          break;
      }
    },
  },
});
</script>

<style module>
.destructiveIcon {
  color: var(--red-500);
}
</style>
