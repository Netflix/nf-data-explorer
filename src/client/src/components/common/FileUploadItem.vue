<template>
  <div>
    <div
      ref="dropArea"
      class="layout vertical"
      :class="$style.dropArea"
      @click="$refs.filePicker.click()"
      @dragenter.stop.prevent="highlight"
      @dragover.stop.prevent="highlight"
      @dragleave.stop.prevent="unhighlight"
      @drop.stop.prevent="onDropFile"
    >
      <template v-if="selectedFiles.length === 0">
        <div>{{ message }}</div>
        <el-button
          type="primary"
          size="small"
          :disabled="disabled"
          @click.stop.prevent="$refs.filePicker.click()"
        >
          <font-awesome-icon :icon="faFileUpload"></font-awesome-icon> Upload
        </el-button>
        <input
          ref="filePicker"
          type="file"
          :multiple="multiple"
          :disabled="disabled"
          hidden
          @change="onSelectFile"
        />
      </template>
      <div
        v-for="file in selectedFiles"
        v-else
        :key="file.name"
        :class="$style.file"
      >
        <font-awesome-icon
          :icon="getFileTypeIcon(file)"
          fixed-width
        ></font-awesome-icon>
        <span :class="$style.filename">{{ file.name }}</span>
        <span>({{ getFileSize(file) }})</span>
        <div>
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="mini"
            class="spacer__top"
            circle
            @click.stop.prevent="onDelete(file)"
          ></el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faFile,
  faFileUpload,
  faFileImage,
  faFileVideo,
} from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import numeral from 'numeral';

export default Vue.extend({
  name: 'FileUploadItem',
  components: {
    [Button.name]: Button,
    FontAwesomeIcon,
  },
  props: {
    message: {
      type: String,
      default:
        'Upload a file by dragging and dropping it here or clicking the button below.',
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      faFile,
      faFileUpload,
      faFileImage,
      faFileVideo,
      selectedFiles: new Array<File>(),
    };
  },
  computed: {},
  methods: {
    getFileTypeIcon(file: File): any {
      const { type } = file;
      if (type.startsWith('image')) return this.faFileImage;
      if (type.startsWith('video')) return this.faFileVideo;
      return this.faFile;
    },
    onSelectFile(e) {
      const files = e.target.files as FileList;
      this.handleFiles(Array.from(files));
    },
    highlight() {
      (this.$refs.dropArea as HTMLElement).classList.add('highlight');
    },
    unhighlight() {
      (this.$refs.dropArea as HTMLElement).classList.remove('highlight');
    },
    onDropFile(e) {
      if (this.disabled) return;
      const dt = e.dataTransfer;
      const files = dt.files as FileList;
      this.handleFiles(Array.from(files));
    },
    getFileSize(file: File) {
      return numeral(file.size).format('0.0b');
    },
    handleFiles(files: File[]) {
      this.unhighlight();
      if (!this.multiple && files.length > 1) {
        return notify(
          NotificationType.Error,
          'Multiple Files Not Allowed',
          'Please choose a single file to upload',
        );
      }
      this.selectedFiles = files;
      this.$emit('change', { files });
    },
    onDelete(file: File) {
      const index = this.selectedFiles.indexOf(file);
      if (index >= 0) {
        this.selectedFiles.splice(this.selectedFiles.indexOf(file), 1);
        this.$emit('change', { files: this.selectedFiles });
      }
    },
  },
});
</script>
<style module>
.dropArea {
  padding: 10px;
  border: 2px dashed #ccc;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file {
  display: grid;
  align-items: center;
  grid-template-columns: 20px auto 90px 40px;
}

.filename {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
