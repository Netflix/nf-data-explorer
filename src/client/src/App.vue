<template>
  <div v-if="!isLoggedIn" class="vertical center-center full-height layout">
    <h1 :class="$style.title">Netflix Data Explorer</h1>
    <h2 :class="$style.subtitle">Signing in...</h2>
  </div>
  <div v-else id="app">
    <TheNav />
    <notification-element app-id="nfdataexplorer2"></notification-element>
    <main class="vertical layout flex">
      <router-view />
    </main>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { MessageBox } from 'element-ui';
import TheNav from '@/components/TheNav.vue';
import { ActionTypes } from '@/store/actions';
import store from '@/store';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';

export default Vue.extend({
  name: 'App',
  components: {
    TheNav,
  },
  data() {
    return {
      isLoggedIn: false,
      refreshTokenTimeoutId: -1,
    };
  },
  computed: {
    userEmail(): string | undefined {
      return store.state.user.email;
    },
    isSessionInvalidated(): boolean {
      return store.state.user.isSessionInvalidated;
    },
    clusterName(): string {
      return this.$route.params.clusterName;
    },
    datastoreScope(): string | undefined {
      const routePieces = this.$route.fullPath.split('/');
      if (routePieces.length < 2 || routePieces[1].length === 0) {
        return undefined;
      }
      return routePieces[1];
    },
  },
  watch: {
    async userEmail(userEmail: string) {
      this.isLoggedIn = !!userEmail;
      if (this.isLoggedIn) {
        this.startTokenRefreshTimer();

        try {
          await Promise.all([
            store.dispatch(ActionTypes.FetchEnvironments),
            store.dispatch(ActionTypes.FetchClusters),
          ]);
        } catch (err) {
          notify(
            NotificationType.Error,
            'Failed to load environment',
            process.env.NODE_ENV === 'production'
              ? err.message
              : 'Is the node server running?',
          );
        }
      }
    },
    isSessionInvalidated() {
      this.clearTokenRefreshTimer();
      MessageBox.alert(
        `We'll need to reload the app to start a new session.`,
        'Session Expired',
        {
          confirmButtonText: 'Continue',
          type: 'warning',
          showClose: false,
        },
      ).then(() => {
        window.location.reload(true);
      });
    },
    clusterName: {
      immediate: true,
      handler(newClusterName, oldClusterName) {
        if (newClusterName === oldClusterName) return;
        store.dispatch(ActionTypes.SetCurrentCluster, {
          name: newClusterName,
        });
      },
    },
    datastoreScope: {
      immediate: true,
      handler(newDatastoreType, oldDatastoreType) {
        if (newDatastoreType === oldDatastoreType) return;
        store.dispatch(ActionTypes.SetDatastoreScope, {
          datastoreType: newDatastoreType,
        });
      },
    },
  },
  created() {
    store.dispatch(ActionTypes.FetchUserInfo);
  },
  methods: {
    startTokenRefreshTimer() {
      this.clearTokenRefreshTimer();
      this.refreshTokenTimeoutId = window.setTimeout(() => {
        store.dispatch(ActionTypes.FetchUserInfo);
        this.startTokenRefreshTimer();
      }, 15 * 60 * 1000);
    },

    clearTokenRefreshTimer() {
      if (this.refreshTokenTimeoutId) {
        window.clearTimeout(this.refreshTokenTimeoutId);
      }
    },
  },
});
</script>
<style module>
.title {
  margin: 0;
}

.subtitle {
  margin-bottom: var(--space-9);
  font-weight: var(--text-normal);
}
</style>
