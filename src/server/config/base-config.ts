/**
 * This configuration file is loaded at app startup.
 *
 * You can override any of these settings by adding a TS file in the `./overrides` directory.
 * Using the CLI will generate a new named override file (e.g. `my-custom-config.ts`). You can
 * then start the app with the following env variable set `DATA_EXPLORER_CONFIG_NAME=my-custom-config`.
 */

export const APP_NAME = 'nf-data-explorer-2';

export const APP_PORT = 80;

/**
 * The list of supported datastores. Support for a datastore can be removed by simply removing it
 * from this list. This will avoid setting up REST routes and displaying UI components for that
 * datastore type.
 */
export const SUPPORTED_DATASTORE_TYPES = ['dynomite', 'cassandra'];

//
// Define the list of AWS regions and environments (accounts) this application is deployed in.
//
export const ENVIRONMENTS = ['local'];
export const REGIONS = ['local'];

export const DYNOMITE_PORT = 8102;
export const REDIS_PORT = 6379;

export const DYNOMITE_REDIS_PORT = REDIS_PORT; // currently dynomite or redis is supported, but not both
export const CASSANDRA_PORT = 9042;

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// Access Control
//  Settings controlling user/group/cluster access control.
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

export const ADMIN_GROUPS = new Array<string>();
export const ADMIN_USERS = new Array<string>();

/**
 * These users/groups have access to all clusters regardless of what ACL
 * information is returned by the configured ACL provider.
 */
export const ALL_CLUSTERS_MEMBERS = new Array<string>();

/**
 * These users/groups have access to all entities on a cluster, regardless of
 * what ACL entity information is returned by the configured ACL provider
 */
export const ALL_ENTITY_MEMBERS = [...ALL_CLUSTERS_MEMBERS];

/**
 * These clusters allow access by all users. These are considered a special case
 * and must have a specific business reason to belong here.
 */
export const UNRESTRICTED_CLUSTERS = new Array<string>();

/**
 * This is denylist of cluster names that should never appear in the list of available clusters.
 */
export const RESTRICTED_CLUSTERS = new Array<string>();

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// Request Headers
//  These are the names of request headers that are expected to contain user identifiable information.
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

export const REQUIRE_AUTHENTICATION = false;

export const REQUEST_HEADER_CLIENT_APP = 'oidc_claim_client_id';
export const REQUEST_HEADER_CLIENT_CERT = 'sslclientcert';
export const REQUEST_HEADER_CLIENT_CERT_VERIFY = 'sslclientverify';
export const REQUEST_HEADER_ACCESS_TOKEN = 'oidc_access_token';
export const REQUEST_HEADER_EMAIL = 'oidc_claim_email';

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// Environment Variables
//  These are the names of environment variables that are expected to be set on startup.
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

export const ENV_VAR_APP_NAME = 'APP_NAME';
export const ENV_VAR_APP_CLUSTER = 'CLUSTER_NAME';
export const ENV_VAR_ENV = 'ENVIRONMENT';
export const ENV_VAR_REGION = 'REGION';

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// App Settings
//   Other app level settings
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The maximum supported file upload in MB. Used when inserting/updating blob columns.
 */
export const MAX_FILE_UPLOAD = 10 * 1024 * 1024;

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// Service Providers
//   These are the provider class names that will be loaded on startup.
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

/** The provider used for adding custom transports to the server-side Winston logger */
export const LOGGER_PROVIDER = 'BaseLoggerProvider';

/** The provider to use for fetching access control information for clusters. */
export const CLUSTER_ACCESS_CONTROL_SERVICE_PROVIDER =
  'DefaultClusterAccessControlProvider';

/** Controls whether or not cluster access control is enforced or not. Defaults to true. */
export const CLUSTER_ACCESS_CONTROL_ENABLED = true;

/** The provider to use for discovering available clusters. */
export const DISCOVERY_PROVIDER = 'EnvironmentDiscoveryProvider' as
  | 'FileSystemDiscoveryProvider'
  | 'LocalDiscoveryProvider'
  | 'EnvironmentDiscoveryProvider';

/**
 * If using a `FileSystemDiscoveryProvider`, this property contains the path to the
 * JSON file that is expected to contain the list of discovered clusters and instances.
 * File name is expected to be found in the `data` directory in the project root.
 */
export const DISCOVERY_PROVIDER_FILESYSTEM_SOURCE = 'discovery.json';

/**
 * If using an `EnvironmentDiscoveryProvider`, these are the environment variables that
 * will point to the Cassandra and Redis hosts.
 */
export const DISCOVERY_PROVIDER_ENVIRONMENT_CASSANDRA_HOST = 'CASSANDRA_HOST';
export const DISCOVERY_PROVIDER_ENVIRONMENT_REDIS_HOST = 'REDIS_HOST';

/**
 * The provider to use for fetching entity access control information
 * (e.g. fetching ownership information for C* keyspaces).
 */
export const ENTITY_ACCESS_CONTROL_LOADER = 'DefaultEntityAccessControlLoader';

export const ENTITY_ACCESS_CONTROL_SERVICE_PROVIDER =
  'DefaultEntityAccessControlServiceProvider';

/**
 * The provider to use for fetching user group information.
 * @see IUserCacheProvider
 */
export const USER_CACHE_PROVIDER = 'DefaultUserCacheProvider';

/**
 * The TTL value in ms that should be used for user cache entries (contains the mapping
 * of user emails -> user groups). Once an entry expires, the loader will be used to fetch
 * user groups on demand.
 */
export const USER_CACHE_TIMEOUT = 5 * 60 * 1000;

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// Cassandra
//   C* specific properties
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The provider to use to specify client options.
 *
 * There is a default base implementation of ICassandraClientOptionsProvider,
 * LocalCassandraClientOptionsProvider, but you can provide your own by creating
 * your own class that implements that interface.
 */
export const CASSANDRA_CLIENT_OPTIONS_PROVIDER =
  'LocalCassandraClientOptionsProvider';

// C* credentials
// Only recommended for local testing. Don't use in production. Default installations
// of C * have authentication enabled and the username / password is `cassandra`.
export const CASSANDRA_BASE_AUTH_PROVIDER_USERNAME = 'cassandra';
export const CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD = 'cassandra';

/**
 * The provider to use for loading metrics such as table/keyspace sizes that may be side-loaded from
 * another service.
 */
export const CASSANDRA_METRICS_PROVIDER = 'CustomCassandraMetricsProvider';

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// App Settings
//   Other app level settings
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * For operations like `DROP TABLE`, require that metrics must be available prior to allowing deletions.
 * Requires `CASSANDRA_METRICS_SUPPORT` to be true and `CASSANDRA_METRICS_PROVIDER` configuration to be specified.
 */
export const CASSANDRA_REQUIRE_METRICS_FOR_DESTRUCTIVE_OPERATIONS = false;

/**
 * Destructive operations like `DROP` and `TRUNCATE` will only be allowed in the following environments.
 */
export const CASSANDRA_ENVIRONMENTS_ALLOWING_DESTRUCTIVE_OPERATIONS = ['local'];

/**
 * Enables the retrieval and display of metrics. Note: requires `CASSANDRA_METRICS_PROVIDER` to be set.
 */
export const CASSANDRA_METRICS_SUPPORT = false;

/**
 * Allow users to drop tables. Sensitive production environments may want to disable this.
 */
export const CASSANDRA_ALLOW_DROP_TABLE = true;

/**
 * Allow users to truncate tables. Sensitive production environments may want to disable this.
 */
export const CASSANDRA_ALLOW_TRUNCATE_TABLE = true;

/**
 * The Data Explorer app is expected to be deployed in each cloud provider's account and region where
 * your datastore clusters are deployed. When a user switches accounts/regions, the user will be
 * redirected to the Data Explorer instance running in that region (so all calls can be made region local).
 *
 * This field will alllow you to build your own host name pattern where variables wil be replaced at runtime.
 *
 * Supported variables:
 *  * appName - The app or host name (e.g. `data-explorer`).
 *  * regionName - The cloud provider region (e.g. `us-east-1`).
 *  * accountName - The name of the cloud provider account (e.g. `test` or `prod`).
 *
 * Note: Do not add any addition path params as this will likely break routing.
 */
export const CLUSTER_REDIRECT_HOST =
  'https://:appName-:regionName.:accountName.acme.net';

/**
 * The patterns to use to filter the pool of available clusters to just those of that
 * data store type. Useful if custom naming conventions are used to identify the type
 * of your cluster (e.g. CASSANDRA_ORDERS or REDIS_SESSIONS). Currently not used by
 * OSS providers.
 */
export const CLUSTER_NAME_PATTERN_CASSANDRA = '.*';
export const CLUSTER_NAME_PATTERN_REDIS = '.*';
export const CLUSTER_NAME_PATTERN_DYNOMITE = '.*';
