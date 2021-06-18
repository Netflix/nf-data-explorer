<template>
  <div class="layout vertical border__right">
    <div class="toolbar layout horizontal border__bottom">
      <el-input v-model="query" placeholder="Search for a key">
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>

      <el-dropdown class="spacer__left" trigger="click" @command="onAdd">
        <el-button type="primary" size="mini">
          <font-awesome-icon
            :icon="faPlusCircle"
            fixed-width
          ></font-awesome-icon>
          Add<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="string">
            <font-awesome-icon :icon="faFont" fixed-width></font-awesome-icon>
            String
          </el-dropdown-item>
          <el-dropdown-item command="hash" divided>
            <font-awesome-icon :icon="faTable" fixed-width></font-awesome-icon>
            Hash
          </el-dropdown-item>
          <el-dropdown-item command="list">
            <font-awesome-icon :icon="faListOl" fixed-width></font-awesome-icon>
            List
          </el-dropdown-item>
          <el-dropdown-item command="set">
            <font-awesome-icon :icon="faBars" fixed-width></font-awesome-icon>
            Set
          </el-dropdown-item>
          <el-dropdown-item command="zset">
            <font-awesome-icon
              :icon="faSortAmountDown"
              fixed-width
            ></font-awesome-icon>
            Sorted Set
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <div class="flex" style="position: relative;">
      <div :class="$style.wrapper">
        <RecycleScroller
          ref="scroller"
          :key="query"
          class="scroller"
          :class="$style.scroller"
          :items="matchingKeys"
          :item-size="41"
          :buffer="buffer"
          :page-mode="false"
          key-field="name"
          :emit-update="true"
          @update="onUpdate"
        >
          <div
            slot-scope="props"
            :class="$style.keyRow"
            class="padded__horizontal layout horizontal"
            @click="onSelectKey(props.item.name)"
          >
            <div :class="$style.keyIndex">{{ props.index + 1 }}:</div>
            <div :class="$style.keyName">{{ props.item.name }}</div>
          </div>

          <div v-if="!isComplete" slot="after" class="padded__horizontal">
            <font-awesome-icon
              :icon="faSpinner"
              class="spacer__right"
              fixed-width
              spin
            ></font-awesome-icon>
            Loading...
          </div>
        </RecycleScroller>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBars,
  faListOl,
  faPlusCircle,
  faFont,
  faSortAmountDown,
  faSpinner,
  faTable,
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  Input,
} from 'element-ui';
import { IScanResult } from '@dynomitetypes/dynomite';
import debounce from 'lodash.debounce';
import { scan } from '@/services/dynomite/DynoService';
import { Routes } from '@/router/routes';
import { RecycleScroller } from 'vue-virtual-scroller';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';

export default Vue.extend({
  name: 'DynoKeyBrowser',
  components: {
    [Button.name]: Button,
    [Dropdown.name]: Dropdown,
    [DropdownItem.name]: DropdownItem,
    [DropdownMenu.name]: DropdownMenu,
    [Input.name]: Input,
    FontAwesomeIcon,
    RecycleScroller,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      buffer: 100,
      faBars,
      faListOl,
      faPlusCircle,
      faFont,
      faSortAmountDown,
      faSpinner,
      faTable,
      isScanning: false,
      query: this.$route.query.query,
      scanResult: undefined as IScanResult | undefined,
    };
  },
  computed: {
    matchingKeys(): any[] {
      if (!this.scanResult) return [];
      return this.scanResult.keys.map((key) => ({
        name: key,
      }));
    },
    isComplete(): boolean {
      return !this.scanResult || this.scanResult.cursor.complete;
    },
  },
  watch: {
    query: {
      immediate: true,
      handler(newValue) {
        this.onQueryChanged(newValue);
      },
    },
    clusterName() {
      this.scanResult = undefined;
    },
  },
  created() {
    this.onQueryChanged = debounce(this.onQueryChanged, 300);
    this.fetchMore = debounce(this.fetchMore, 300);
  },
  methods: {
    onAdd(type) {
      this.$router
        .push({
          name: Routes.DynomiteCreateKey,
          params: {
            clusterName: this.clusterName,
          },
          query: {
            type,
          },
        })
        .catch(() => {
          // prevent nav duplicated errors
        });
    },
    async onQueryChanged(query) {
      this.isScanning = true;
      try {
        this.scanResult = await scan(this.clusterName, query, '');
        this.$router
          .push({
            name: this.$route.name as string,
            params: this.$route.params,
            query: {
              query,
            },
          })
          .catch(() => {
            // prevent nav duplicated errors
          });
      } catch (err) {
        notify(
          NotificationType.Error,
          'Scan failed',
          err.remediation || err.message,
        );
      } finally {
        this.isScanning = false;
      }
    },
    onSelectKey(keyName) {
      if (keyName) {
        this.$router
          .push({
            name: Routes.DynomiteEditKey,
            params: {
              clusterName: this.clusterName,
              keyName,
            },
            query: this.$route.query,
          })
          .catch(() => {
            // prevent nav duplicated errors
          });
      } else {
        this.$router
          .push({
            name: Routes.DynomiteEmptyKeyView,
            params: {
              clusterName: this.clusterName,
            },
            query: this.$route.query,
          })
          .catch(() => {
            // prevent nav duplicated errors
          });
      }
    },
    onUpdate(_startIndex, endIndex) {
      if (endIndex === this.matchingKeys.length) {
        this.fetchMore();
      }
    },
    async fetchMore() {
      this.isScanning = true;
      try {
        if (!this.scanResult) return;
        if (this.scanResult && this.scanResult.cursor.complete) {
          return;
        }
        const cursor = this.scanResult ? this.scanResult.cursor : '';
        const pageResults = await scan(
          this.clusterName,
          this.query as string,
          JSON.stringify(cursor),
        );
        this.scanResult.keys = [...this.scanResult.keys, ...pageResults.keys];
        this.scanResult.cursor = pageResults.cursor;

        this.$router
          .push({
            name: this.$route.name as string,
            params: this.$route.params,
            query: {
              query: this.query,
            },
          })
          .catch(() => {
            // prevent nav duplicated errors
          });
      } catch (err) {
        notify(
          NotificationType.Error,
          'Failed to fetch keys',
          err.remediation || err.message,
        );
      } finally {
        this.isScanning = false;
      }
    },
  },
});
</script>
<style module>
.wrapper {
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
}

.scroller {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.keyRow {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  line-height: 41px;
  height: 41px;
  margin-right: 10px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.keyRow:hover {
  background-color: var(--color-background);
  cursor: pointer;
}

.keyIndex {
  color: var(--color-text-subdued);
  margin-right: var(--spacer-standard);
}

.keyName {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
