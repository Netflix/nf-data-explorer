<template>
  <el-form-item
    :class="$style['helpful-form-item']"
    :prop="prop"
    :label="label"
  >
    <slot></slot>
    <el-popover
      placement="top-start"
      :title="popoverTitle"
      :content="help"
      width="400"
      trigger="hover"
    >
      <font-awesome-icon
        slot="reference"
        :class="$style.icon"
        class="spacer__left"
        :icon="faQuestionCircle"
        >help</font-awesome-icon
      >
      <slot v-if="hasHelpSlot" name="help">{{ help }}</slot>
    </el-popover>
  </el-form-item>
</template>
<script lang="ts">
import Vue from 'vue';
import { FormItem, Popover } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'HelpfulFormItem',
  components: {
    [FormItem.name]: FormItem,
    [Popover.name]: Popover,
    FontAwesomeIcon,
  },
  props: {
    /** The label for the el-form-item */
    label: {
      type: String,
    },
    /** The title of the popover (optional, if not specified, the `label` will be used instead) */
    title: {
      type: String,
    },
    /** The help text to display in the popover */
    help: {
      type: String,
    },
    /**
     * @argument The form property for this form item
     */
    prop: {
      type: String,
    },
  },
  data() {
    return {
      faQuestionCircle,
      popoverTitle: this.title || this.label,
    };
  },
  computed: {
    hasHelpSlot(): boolean {
      return !!this.$slots['help'];
    },
  },
});
</script>
<style module>
.helpful-form-item :global .el-form-item__content > div:first-of-type {
  max-width: calc(100% - 30px);
}

.icon {
  font-size: 16px;
  color: var(--color-text);
}

.icon:hover {
  color: var(--color-action);
  cursor: help;
}
</style>
