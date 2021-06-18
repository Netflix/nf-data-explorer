<template>
  <div :class="$style['cass-create-table-statement-preview']">
    <ace-editor
      v-model="statementModel"
      width="100%"
      class="flex padded bordered"
      :class="$style.editor"
      theme="textmate"
      lang="cql"
      :options="{ wrap: true }"
      @init="initEditor"
      @input="$emit('input', statementModel)"
    ></ace-editor>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Collapse, CollapseItem } from 'element-ui';
import AceEditor from '@/components/common/AceEditor.vue';

export default Vue.extend({
  name: 'CassCreateTableStatementPreview',
  components: {
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    AceEditor,
  },
  props: {
    value: {
      type: String,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      statementModel: this.value || '',
    };
  },
  watch: {
    value(value) {
      this.statementModel = value;
    },
  },
  methods: {
    initEditor(editor) {
      editor.setShowPrintMargin(false);
      editor.setReadOnly(this.readonly);
      editor.renderer.setShowGutter(false);
    },
  },
});
</script>
<style module>
.cass-create-table-statement-preview :global .el-collapse-item__arrow {
  float: left;
  margin-left: var(--spacer-standard);
}

.cass-create-table-statement-preview :global .el-collapse-item__content {
  padding-bottom: 0;
}
</style>
