<template>
  <el-select v-model="$i18n.locale" @change="onChangeLanguage">
    <font-awesome-icon
      slot="prefix"
      :icon="faGlobe"
      style="margin-top: 10px;"
    ></font-awesome-icon>
    <el-option v-for="(lang, i) in languages" :key="`Lang${i}`" :value="lang">{{
      lang
    }}</el-option>
  </el-select>
</template>
<script lang="ts">
import i18n from '@/i18n';
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { Option, Select } from 'element-ui';
import { changeLanguage } from '@/services/ConfigService';

export default Vue.extend({
  name: 'I18nSelector',
  components: {
    [Option.name]: Option,
    [Select.name]: Select,
    FontAwesomeIcon,
  },
  data() {
    return { faGlobe, languages: Object.keys(i18n.messages) };
  },
  methods: {
    onChangeLanguage(language: string) {
      changeLanguage(language);
    },
  },
});
</script>
