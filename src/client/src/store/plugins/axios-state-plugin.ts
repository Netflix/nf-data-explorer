import axios from 'axios';
import get from 'lodash.get';

/**
 * Provides an easy way to map Vuex state to Headers applied to all Axios requests.
 *
 *  createAxiosPlugin({
 *    Authorization: {
 *      path: 'user.token',
 *      computed(value) { return `Bearer ${value}`; },
 *    },
 *    'Header1': 'sliceA.prop1',
 *    'Header2': 'sliceB.prop2',
 *  });
 * @param headerToStateMapping
 */
export function createAxiosPlugin(headerToStateMapping: any) {
  // eslint-disable-line
  if (!headerToStateMapping) {
    throw new Error('Mapping of Axios headers to Vuex state path is required');
  }
  const axiosPlugin = (store: any) => {
    store.subscribe((_mutation: any, state: string) => {
      Object.keys(headerToStateMapping).forEach((header) => {
        let value;
        const mapping = headerToStateMapping[header];
        if (typeof mapping === 'string') {
          // if mapping is a string, then it is expected to be a path to a state property
          value = get(state, mapping);
        } else {
          // otherwise, assume it is a computed property with a `path` and a `computed` function
          value = mapping.computed(get(state, mapping.path));
        }
        if (value) {
          axios.defaults.headers.common[header] = value;
        } else {
          delete axios.defaults.headers.common[header];
        }
      });
    });
  };
  return axiosPlugin;
}
