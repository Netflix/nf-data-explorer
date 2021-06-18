<template>
  <div>
    <!-- encoding and input field -->
    <template v-if="showEncodingAndInput">
      <cass-encoding-dropdown
        v-if="showEncodingAndInput"
        v-model="value.options.encoding"
        empty-text="Choose encoding"
        style="width: 150px;"
        required
        :disabled="!allowBlobEdit"
        @change="encodingChanged = true"
      ></cass-encoding-dropdown>
      <el-input
        v-if="showEncodingAndInput"
        v-model="value.value"
        :placeholder="
          value.value === undefined && !create ? '<blob>' : undefined
        "
        :class="[$style.blobInput, { [$style.blobInputCreate]: create }]"
        :disabled="!allowBlobEdit"
        @change="onChangeValue"
      ></el-input>
    </template>

    <!-- Show drag & drop target -->
    <template v-if="create">
      <el-button type="text" @click="createWithFile = !createWithFile">{{
        createWithFile
          ? 'Enter binary value manually...'
          : 'Upload a file instead...'
      }}</el-button>

      <file-upload-item
        v-if="createWithFile"
        :class="$style.uploadItem"
        :message="
          'Upload a file to store in \'' +
          name +
          '\' by dragging and dropping it here or clicking the button below'
        "
        :column-name="name"
        @change="onChangeFile($event.files)"
      ></file-upload-item>
    </template>

    <!-- blob download dropdown -->
    <el-dropdown
      v-if="!create"
      trigger="click"
      class="spacer__left"
      @command="onCommand"
    >
      <el-button type="primary" size="mini"
        >Actions
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="Commands.Download">
          <font-awesome-icon :icon="faDownload" fixed-width></font-awesome-icon>
          Download
        </el-dropdown-item>
        <el-dropdown-item :command="Commands.ViewAsHex">
          <font-awesome-icon :icon="faEye" fixed-width></font-awesome-icon>
          View as Hex
          <font-awesome-icon
            :icon="faExternalLinkAlt"
            fixed-width
          ></font-awesome-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>

    <!-- encoding changed warning -->
    <el-alert
      v-if="!create && showEncodingAndInput && encodingChanged"
      type="warning"
      title="Encoding has changed. Saving will persist this value with the new encoding."
      class="spacer__top"
      style="padding-top: 0; padding-bottom: 0;"
      :closable="false"
      show-icon
    ></el-alert>

    <!-- value must be decoded warning -->
    <el-alert
      v-if="
        !create &&
        showEncodingAndInput &&
        columnType === 'column' &&
        value.value === undefined
      "
      type="warning"
      title="This value is encoded and must be decoded to be displayed. Please re-rerun your search and choose to decode value columns."
      class="spacer__top"
      style="padding-top: 0; padding-bottom: 0;"
      :closable="false"
      show-icon
    ></el-alert>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faDownload,
  faEye,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  Alert,
  Button,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Input,
} from 'element-ui';
import { IKeyQueryColumnDetails } from '@cassandratypes/cassandra';
import CassEncodingDropdown from './CassEncodingDropdown.vue';
import FileUploadItem from '@/components/common/FileUploadItem.vue';

enum Commands {
  Download = 'Download',
  ViewAsHex = 'ViewAsHex',
}

export default Vue.extend({
  name: 'CassTableRowFormItemBlob',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Dropdown.name]: Dropdown,
    [DropdownMenu.name]: DropdownMenu,
    [DropdownItem.name]: DropdownItem,
    [Input.name]: Input,
    FileUploadItem,
    FontAwesomeIcon,
    CassEncodingDropdown,
  },
  props: {
    value: {
      type: Object as Prop<IKeyQueryColumnDetails>,
    },
    create: {
      type: Boolean,
      required: true,
    },
    // the name of the column
    name: {
      type: String as Prop<string>,
      required: true,
    },
    // the type of column partition/clustering/column
    columnType: {
      type: String,
      required: true,
      validator: (value: string) => {
        return ['partition', 'clustering', 'column'].includes(value);
      },
    },
  },
  data() {
    return {
      Commands,
      faDownload,
      faEye,
      faExternalLinkAlt,
      createWithFile: false,
      encodingChanged: false,
    };
  },
  computed: {
    allowBlobEdit(): boolean {
      return this.create || (!this.create && this.columnType === 'column');
    },
    showEncodingAndInput(): boolean {
      return !this.create || (this.create && !this.createWithFile);
    },
  },
  methods: {
    onChangeValue() {
      this.$emit('input', this.value);
    },
    onCommand(command) {
      switch (command) {
        case Commands.Download:
          this.$emit('download', { column: this.name, type: 'download' });
          break;
        case Commands.ViewAsHex:
          this.$emit('download', { column: this.name, type: 'hex' });
          break;
      }
    },
    onChangeFile(files: File[]) {
      this.value.options.encoding = 'hex';
      this.value.value = files.length > 0 ? files[0] : undefined;
    },
  },
});
</script>
<style module>
.blobInput {
  margin-left: 10px;
  width: calc(100% - 300px);
}

.blobInputCreate {
  width: 75%;
  margin-left: 10px;
}
</style>
