<template>
  <div class="cass-query-nav layout horizontal">
    <div class="full-height">
      <el-menu
        :class="$style.menu"
        class="full-height"
        :default-active="value"
        :collapse="true"
        menu-trigger="click"
        unique-opened
        @select="onSelectMenu"
      >
        <el-menu-item
          v-for="menu in menuItems"
          :key="menu.name"
          :index="menu.name"
        >
          <font-awesome-icon
            :icon="menu.icon"
            fixed-width
            @mousedown.stop
          ></font-awesome-icon>
          <span slot="title">{{ menu.tooltip }}</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- hidden buttons used for adding key shortcuts -->
    <button
      v-for="menu in menuItems"
      :key="menu.name"
      v-shortkey.once="menu.shortcut"
      hidden
      @shortkey="onSelectMenu(menu.name)"
    ></button>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Menu, MenuItemGroup, MenuItem } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VueShortkey from 'vue-shortkey';
import { menuItems } from './cassandra-nav-menu-items';

Vue.use(VueShortkey);

export default Vue.extend({
  name: 'CassQueryNavMenu',
  components: {
    [Menu.name]: Menu,
    [MenuItemGroup.name]: MenuItemGroup,
    [MenuItem.name]: MenuItem,
    FontAwesomeIcon,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      validator(value: string) {
        return (
          value === undefined || menuItems.some((item) => item.name === value)
        );
      },
    },
  },
  data() {
    return {
      menuItems,
    };
  },
  computed: {
    isExpanded(): boolean {
      return !!this.value;
    },
  },
  methods: {
    onSelectMenu(view) {
      this.$emit('selected', view == this.value ? undefined : view);
    },
  },
});
</script>
<style module>
.menu {
  background-color: var(--color-activity-bar) !important;
  border-right: 1px solid var(--color-border);
}

.collpased {
  min-width: 50px;
}
</style>
<style scoped>
.cass-query-nav >>> .el-menu-item {
  font-size: 16px;
}

.cass-query-nav >>> .el-menu-item.is-active {
  background-color: var(--color-action);
  color: white;
  font-size: 16px;
}
</style>
