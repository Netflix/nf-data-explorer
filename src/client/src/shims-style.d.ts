// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Vue from 'vue';

declare module 'vue/types/vue' {
  interface Vue {
    // Augmentation to allow CSS Modules in .vue files:
    $style: { [key: string]: string };
  }
}
