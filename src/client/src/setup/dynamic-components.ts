/**
 * In an effort to support the OSS community, we provide dynamically loaded components that allow us to
 * globally register components with different implementation based on the presence/absence of a custom component.
 */
import Vue from 'vue';

const DEFAULT = 'base';
const CUSTOM = 'nflx';

/**
 * The list of dynamically loaded components.
 */
const GLOBAL_COMPONENT_NAMES = ['email-selector', 'notification-element'];

/**
 * Globally registers dynamically loaded components.
 */
export default function register(): void {
  GLOBAL_COMPONENT_NAMES.forEach((componentName) => {
    Vue.component(componentName, () =>
      // Note: WebPack cannot load a path that uses a variable root path, thus the path duplication.
      // attempt to load the custom component, but fallback to the default component if a custom
      // component cannot be found.
      import(
        /* webpackChunkName: 'dynamic' */ `../components/dynamic/${CUSTOM}/${componentName}.vue`
      ).catch(() =>
        import(
          /* webpackChunkName: 'base' */ `../components/dynamic/${DEFAULT}/${componentName}.vue`
        ),
      ),
    );
  });
}
