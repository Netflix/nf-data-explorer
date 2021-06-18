<template>
  <div class="layout horizontal center" :class="$style.navContainer">
    <el-menu
      mode="horizontal"
      background-color="#39546a"
      text-color="#F8F8F8"
      active-text-color="#F8F8F8"
      unique-opened
      router
    >
      <el-menu-item index="/">
        <h1>Data Explorer</h1>
      </el-menu-item>
    </el-menu>

    <cluster-selector
      v-if="!datastoreScope || clusterName"
      class="spacer__left spacer__right"
    ></cluster-selector>

    <el-menu
      mode="horizontal"
      class="flex spacer__left"
      background-color="#39546a"
      text-color="#F8F8F8"
      active-text-color="#F8F8F8"
      unique-opened
      router
    >
      <cassandra-nav v-if="isCassandraCluster && clusterName"></cassandra-nav>
      <dynomite-nav v-if="isDynomiteCluster && clusterName"></dynomite-nav>

      <el-submenu index="help" style="float: right;">
        <template slot="title">Help</template>
        <el-menu-item index="docs">
          <div class="horizontal center layout">
            <font-awesome-icon :icon="faExternalLinkAlt" size="xs" />
            <a
              :href="$t('nav.help.documentation.href')"
              target="_blank"
              rel="noopener"
              @click.stop
              >{{ $t('nav.help.documentation.label') }}</a
            >
          </div>
        </el-menu-item>
        <el-menu-item index="slack">
          <div class="horizontal center layout">
            <font-awesome-icon :icon="faExternalLinkAlt" size="xs" />
            <a
              :href="$t('nav.help.chat.href')"
              target="_blank"
              rel="noopener"
              @click.stop
              >{{ $t('nav.help.chat.label') }}</a
            >
          </div>
        </el-menu-item>
        <el-menu-item index="email">
          <div class="horizontal center layout">
            <font-awesome-icon :icon="faExternalLinkAlt" size="xs" />
            <a :href="$t('nav.help.email.href')" @click.stop>{{
              $t('nav.help.email.label')
            }}</a>
          </div>
        </el-menu-item>
      </el-submenu>

      <el-menu-item v-if="isAdmin" index="/admin" style="float: right;">
        <router-link :to="{ name: Routes.Admin }" @click.stop>
          <font-awesome-icon :icon="faShieldAlt" /> Admin</router-link
        >
      </el-menu-item>

      <div v-if="isAdmin" style="float: right; padding-top: 3px;">
        <i18n-selector></i18n-selector>
      </div>
    </el-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Menu, Submenu, MenuItem } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCompass,
  faExternalLinkAlt,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import ClusterSelector from '@/components/ClusterSelector.vue';
import CassandraNav from '@/components/cassandra/CassandraNav.vue';
import DynomiteNav from '@/components/dynomite/DynomiteNav.vue';
import i18nSelector from '@/components/common/i18nSelector.vue';
import store from '@/store';
import { Routes } from '@/router/routes';

export default Vue.extend({
  name: 'TheNav',
  components: {
    [Menu.name]: Menu,
    [Submenu.name]: Submenu,
    [MenuItem.name]: MenuItem,
    FontAwesomeIcon,
    ClusterSelector,
    CassandraNav,
    DynomiteNav,
    i18nSelector,
  },
  data() {
    return {
      Routes,
      faCompass,
      faExternalLinkAlt,
      faShieldAlt,
    };
  },
  computed: {
    currentCluster(): string | undefined {
      return store.state.config.currentCluster;
    },
    clusterName(): string | undefined {
      return this.currentCluster;
    },
    datastoreScope(): 'cassandra' | 'dynomite' | undefined {
      return store.state.config.currentDatastoreScope;
    },
    isCassandraCluster(): boolean {
      return this.datastoreScope === 'cassandra';
    },
    isDynomiteCluster(): boolean {
      return this.datastoreScope === 'dynomite';
    },
    isAdmin(): boolean {
      return store.state.user.isAdmin;
    },
  },
});
</script>
<style module>
.navContainer {
  background-color: #39546a;
}

.navContainer :global .el-menu {
  border-bottom-width: 0 !important;
}

.dynoKeyCount {
  font-size: 18px;
  color: white;
  text-transform: uppercase;
  font-weight: bold;
}
</style>
