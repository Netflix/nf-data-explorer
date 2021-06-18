<template>
  <div
    ref="editor"
    class="border__top border__bottom"
    :style="styleString"
  ></div>
</template>
<script lang="ts">
import Vue from 'vue';
import ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import { Prop } from 'vue/types/options';

export default Vue.extend({
  name: 'AceEditor',
  props: {
    value: {
      type: String,
      required: true,
    },
    lang: {
      type: String,
    },
    theme: {
      type: String,
    },
    height: {
      type: String,
    },
    width: {
      type: String,
    },
    minLines: {
      type: Number as Prop<number | undefined>,
      default: 10,
    },
    maxLines: {
      type: Number,
      default: 100,
    },
    autoFit: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Object,
    },
  },
  data() {
    return {
      editor: undefined as ace.Ace.Editor | undefined,
      contentBackup: '',
    };
  },
  computed: {
    styleString(): string {
      const height = this.height ? this.px(this.height) : '100%';
      const width = this.width ? this.px(this.width) : '100%';
      return 'height: ' + height + '; width: ' + width;
    },
  },
  watch: {
    value(val) {
      if (this.contentBackup !== val) {
        if (this.editor) {
          this.editor.setValue(val, 1);
        }
        this.contentBackup = val;
      }
    },
    theme(newTheme) {
      if (this.editor) {
        this.editor.setTheme('ace/theme/' + newTheme);
      }
    },
    lang(newLang) {
      if (this.editor) {
        this.editor.getSession().setMode('ace/mode/' + newLang);
      }
    },
    options(newOption) {
      if (this.editor) {
        this.editor.setOptions(newOption);
      }
    },
    height: 'resize',
    width: 'resize',
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
      this.editor.container.remove();
    }
  },
  mounted() {
    /* eslint-disable @typescript-eslint/no-this-alias */
    const vm = this;
    const lang = this.lang || 'text';
    const theme = this.theme || 'chrome';

    const options = {
      maxLines: this.maxLines,
      minLines: this.minLines,
      showPrintMargin: false,
    };
    if (this.autoFit) {
      options.minLines = undefined;
      options.maxLines = Infinity;
    }

    this.editor = ace.edit((this.$refs as any).editor, options);

    const editor = (vm.editor = ace.edit(this.$el));

    this.$emit('init', editor);

    // editor.$blockScrolling = Infinity;
    // editor.setOption('enableEmmet', true);
    editor.getSession().setMode('ace/mode/' + lang);
    editor.setTheme('ace/theme/' + theme);
    editor.setValue(this.value, 1);
    this.contentBackup = this.value;

    editor.on('change', function () {
      const content = editor.getValue();
      vm.$emit('input', content);
      vm.contentBackup = content;
    });
    if (vm.options) editor.setOptions(vm.options);
  },
  methods: {
    px(n) {
      return /^\d*$/.test(n) ? n + 'px' : n;
    },
    resize() {
      Vue.nextTick(() => {
        if (this.editor) {
          this.editor.resize();
        }
      });
    },
  },
});
</script>
