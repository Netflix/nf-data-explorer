import { IAppState } from '@/typings/store';
import { ICassandraFeatureMap } from '@cassandratypes/cassandra';
import { Store } from 'vuex';

/**
 * Since Vuex getters are akward to make type-safe we have a utility
 * method to check for features by name.
 */
export function hasFeature(
  store: Store<IAppState>,
  name: keyof ICassandraFeatureMap,
): boolean {
  if (!name) {
    throw new Error('hasFeature getter requires a feature name');
  }
  if (name === 'envsAllowingDestructiveOperations') {
    return false;
  }
  return store.state.cassandra.features[name];
}
