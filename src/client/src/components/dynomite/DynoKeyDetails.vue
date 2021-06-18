<template>
  <div class="layout vertical">
    <!-- toolbar -->
    <div class="toolbar layout horizontal justified">
      <strong v-if="!create">
        <font-awesome-icon :icon="faKey" fixed-width></font-awesome-icon>
        {{ keyName }}
      </strong>
      <strong v-else :class="$style.title"
        >Create New {{ keyValue.type }} Key</strong
      >
      <div>
        <el-button v-if="!create" type="danger" @click="onDelete">
          <font-awesome-icon :icon="faTrashAlt" fixed-width></font-awesome-icon>
          Delete
        </el-button>
      </div>
    </div>

    <!-- string values -->
    <dyno-key-string-editor
      v-if="keyValue && keyValue.type === 'string'"
      v-model="keyValue"
      :cluster-name="clusterName"
      :create="create"
      class="flex"
      @key-created="transitionToRoute(keyValue.name)"
      @cancel="transitionToRoute()"
    ></dyno-key-string-editor>

    <!-- collection values -->
    <dyno-key-collection-editor
      v-else-if="keyValue && keyValue.type !== 'string'"
      v-model="keyValue"
      :cluster-name="clusterName"
      :key-name="keyName"
      :type="keyValue.type"
      :create="create"
      class="flex"
      @key-created="transitionToRoute(keyValue.name)"
      @key-updated="$emit('key-updated')"
    ></dyno-key-collection-editor>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBan,
  faKey,
  faSave,
  faSpinner,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Button, Form, FormItem, Input } from 'element-ui';
import { IKeyValue } from '@dynomitetypes/dynomite';
import { Routes } from '@/router/routes';
import { deleteKey } from '@/services/dynomite/DynoService';
import { notify, confirmPrompt } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import DynoKeyCollectionEditor from '@/components/dynomite/DynoKeyCollectionEditor.vue';
import DynoKeyStringEditor from '@/components/dynomite/DynoKeyStringEditor.vue';

export default Vue.extend({
  name: 'DynoKeyDetails',
  components: {
    [Button.name]: Button,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    DynoKeyCollectionEditor,
    FontAwesomeIcon,
    DynoKeyStringEditor,
  },
  props: {
    clusterName: {
      type: String,
    },
    create: {
      type: Boolean,
    },
    name: {
      type: String,
    },
    value: {
      type: Object as Prop<IKeyValue>,
    },
  },
  data() {
    return {
      faBan,
      faKey,
      faSave,
      faSpinner,
      faTrashAlt,
      isDeleting: false,
      isSaving: false,
      keyName: this.name,
      keyValue: this.value,
    };
  },
  computed: {
    formModel(): any {
      return {
        name: this.keyName,
        ttl: this.value ? this.value.ttl : -1,
        value: this.value ? this.value.value : undefined,
      };
    },
  },
  watch: {
    name(newName) {
      this.keyName = newName;
    },
    value(newValue) {
      this.keyValue = newValue;
    },
  },
  methods: {
    onChange() {
      this.$emit('input', this.value);
    },
    async onDelete() {
      if (
        await confirmPrompt(
          'Confirm Deletion',
          `Are you sure you want to permanently delete the following key?\n${this.keyName}`,
          'Yes, Delete',
          'No, Cancel',
          NotificationType.Warning,
          {
            customClass: 'deleteKeyMsgBox',
          },
        )
      ) {
        try {
          this.isDeleting = true;
          await deleteKey(this.clusterName, this.keyName);
          notify(
            NotificationType.Success,
            'Delete Key',
            `Deleted key ${this.keyName} successfully`,
          );
          this.transitionToRoute();
        } catch (err) {
          notify(
            NotificationType.Error,
            'Error Deleting Key',
            `Failed to delete key. This key may have already been deleted.`,
          );
        } finally {
          this.isDeleting = false;
        }
      }
    },
    transitionToRoute(keyName?: string) {
      const query = this.$route.query;
      if (keyName) {
        this.$router.push({
          name: Routes.DynomiteEditKey,
          params: {
            clusterName: this.clusterName,
            keyName,
          },
          query,
        });
      } else {
        this.$router.push({
          name: Routes.DynomiteEmptyKeyView,
          params: {
            clusterName: this.clusterName,
          },
          query,
        });
      }
    },
  },
});
</script>
<style module>
.title {
  text-transform: capitalize;
}
</style>
<style>
.deleteKeyMsgBox {
  min-width: 500px;
}

.deleteKeyMsgBox .el-message-box__message {
  white-space: pre-wrap;
}
</style>
