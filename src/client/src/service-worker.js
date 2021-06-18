/* global workbox */
workbox.routing.registerRoute('/logo.png', () => {
  console.log('service worker serving logo');
});

workbox.routing.registerRoute(
  new RegExp('/REST/datastores/cassandra/clusters$'),
  workbox.strategies.staleWhileRevalidate(),
);

workbox.routing.registerRoute(
  new RegExp('/REST/datastores/cassandra/clusters/.+/keyspaces$'),
  workbox.strategies.staleWhileRevalidate(),
);

workbox.routing.registerRoute(
  new RegExp('/REST/datastores/cassandra/clusters/.+/schema$'),
  workbox.strategies.staleWhileRevalidate(),
);

workbox.core.skipWaiting();
workbox.core.clientsClaim();
