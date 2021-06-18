# Netflix Data Explorer

The Netflix Data Explorer tool allows users to explore data stored in several popular datastores (currently Cassandra, Dynomite, and Redis).

## Quick Start

To help get you started, we have provided a demo environment that you can run via Docker. You'll need to run a couple of commands to get up and running ([install Yarn](https://yarnpkg.com/getting-started/install) first if you don't already have it).

Note: if using Apple silicon, you will need to run the Terminal using [Rosetta](https://support.apple.com/en-us/HT211861).

```bash
yarn
yarn docker:demo
```

This will run a production build of the app, a Cassandra instance, and a Redis instance, all locally.

![Docker PS](https://github.com/Netflix/nf-data-explorer/blob/master/.github/docker_ps.png?raw=true 'Docker PS')

Note: the first time you run this command, it will take some time to pull down the images and run a complete build. Once the app starts, your browser will open the app. You may also need to wait a minute while C\* and Redis startup. Run the command, and then grab some ☕️.

After the first invocation, future invocations of `yarn docker:demo` will be much faster.

Also note: If you see a "No Hosts Available" error, it's likely due to C\* still starting up.

### Docker Configuration

To run the demo environment, you will need to allocate 2GB of memory to Docker. This is easily done if using Docker for Windows or Mac by adjusting the slider on the [Resources tab of the Preferences page](https://docs.docker.com/docker-for-mac/#resources). Note, 2GB is also the current default for Docker for Window or Mac.

You can also run `docker system info | grep Memory` to view your allocated memory if you installed Docker via some other means (e.g. VirtualBox/brew/etc). Please see the documentation for your particular Docker installation on how to change these settings.

## Developing/Contributing

If you are thinking about contributing, please be sure to check out [Contributing Guidelines](https://github.com/Netflix/nf-data-explorer/blob/master/CONTRIBUTING.MD).

## Description

The Netflix Data Explorer strives to be a turn-key solution for connecting to Cassandra and Dynomite/Redis datastores. It was developed for internal use at Netflix to codify some of our best practices and help our engineers quickly access their data.

We have provided integration hooks so you can use the Data Explorer in your environment. Since all environments are unique, many configuration overrides can be specified to adapt the app for your particular use case. For instance, you might have clusters with C\* authentication enabled, or clusters that are discovered by polling a REST service, etc. We've provided seams so you can integrate accordingly.

## Custom Environments

If you want to experiment connecting to Cassandra or Redis clusters in your environment (not using the provided Docker environment), you will need to generate an overridden config file.

```typescript
// example custom config file

// only support C* (no Redis)
export const SUPPORTED_DATASTORE_TYPES = ['cassandra'];

// discovery settings
export const DISCOVERY_PROVIDER = 'FileSystemDiscoveryProvider'; // read a file to get information about available clusters
export const DISCOVERY_PROVIDER_FILESYSTEM_SOURCE = 'discovery.json'; // provides cluster discovery information
export const ENVIRONMENTS = ['test'];
export const REGIONS = ['us-east-1'];

// disable C* authentication
export const CASSANDRA_BASE_AUTH_PROVIDER_USERNAME = undefined;
export const CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD = undefined;

// hypothetical test environment uses a custom port
export const CASSANDRA_PORT = 7199;

// use a custom class to provide C* connection options
export const CASSANDRA_CLIENT_OPTIONS_PROVIDER =
  'CustomCassandraClientOptionsProvider';
```

### Generating a custom config file via the CLI

While a configuration override file can be crafted by hand, we recommend using the provided CLI tool to help you generate it. Please follow all prompts from the tool.

```bash
yarn # only required if you haven't run yarn up to this point
yarn setup
```

![Yarn Setup](https://github.com/Netflix/nf-data-explorer/blob/master/.github/yarn_setup.png?raw=true 'Yarn Setup')

Once your config file is generated, the CLI will print the startup commands for you.

![Yarn Setup Startup](https://github.com/Netflix/nf-data-explorer/blob/master/.github/yarn_setup_startup.png?raw=true 'Yarn Setup Startup')

### Using the custom config file

Once you have a custom config file created, you have a few options on how you can use it:

- Demo mode
- Dev mode
- Production mode

#### Demo

If you want to use this custom config file with the Data Explorer docker demo image (e.g., running the Data Explorer in Docker, but using a config file that points to C\* clusters in your network), you will need to update the `.env` file in the project root.

```bash
# .env file
DATA_EXPLORER_CONFIG_NAME=my-custom-config
```

Once you've updated the variable, you can re-run the command:

```bash
yarn docker:demo
```

#### Dev

To run in Dev mode directly from source, you can run `yarn dev`.

If you have a config file created, it will be used automatically. If you have multiple config files, the `yarn dev` command will pause and prompt you to choose one - this is handy if you are switching between environments while developing.

```bash
# install dependencies
yarn

# run a local dev server for the UI, start a node server in watch mode, and start a local C* and Redis cluster
yarn dev

# optional: tail the local C* and Redis cluster logs so you can see what the server is doing
yarn docker:taillogs
```

The UI will be available at [http://localhost:3000](http://localhost:3000). Please note the 3000 port. A WebPack Dev Server serves the UI, and requests are proxied to Node app running on port 80.

#### Production

To run in Production mode, run the following commands. In Production mode, you will need to export the variable `DATA_EXPLORER_CONFIG_NAME` to use your file.

```bash
# install dependencies
yarn

# build for production
yarn build

# start the app using your config file
export DATA_EXPLORER_CONFIG_NAME=my-custom-config && yarn start
```

The UI will be available at [http://localhost](http://localhost).

## Re-building the Docker image

The `yarn docker:demo` command will start C\*, Redis, and a dockerized version of the Data Explorer app. If you make changes to the source and want to rebuild the Data Explorer docker image, simply run:

```bash
yarn docker:build
```

## Features

### Cassandra Features

Here are a sampling of some of the features available in the Netflix Data Explorer.

#### Multi-Cluster Access

Multi-cluster access provides easy access to all of the clusters in your environment. The cluster selector in the top nav allows you to switch to any of your discovered clusters quickly.

![Cluster Selector](https://github.com/Netflix/nf-data-explorer/blob/master/.github/cluster_selector.png?raw=true 'Cluster Selector')

#### Explore Your Data

The Explore view provides a simple way to explore your data quickly. You can query by partition and clustering keys, insert and edit records, and easily export the results or download them as CQL statements.

![Explore View](https://github.com/Netflix/nf-data-explorer/blob/master/.github/explore_view.png?raw=true 'Explore View')

You can also query and decode binary data.

![Binary Data Support](https://github.com/Netflix/nf-data-explorer/blob/master/.github/blob_support.gif?raw=true 'Binary Data Support')

#### Schema Designer

Creating a new Keyspace and Table by hand can be error-prone

Our schema designer UI streamlines creating a new Table with improved validation and enforcement of best practices.

![Schema Designer](https://github.com/Netflix/nf-data-explorer/blob/master/.github/schema_designer.gif?raw=true 'Schema Designer')

#### Query IDE

The Query Mode provides a powerful IDE-like experience for writing free-form CQL queries.

![Query IDE](https://github.com/Netflix/nf-data-explorer/blob/master/.github/query_ide.gif?raw=true 'Query IDE')

### Dynomite and Redis Features

#### Key Scanning

Browsing through keys in an in-memory database like Redis can cause performance problems if you attempt to use the [KEYS](https://redis.io/commands/keys) command. Instead, it's recommended that you perform a cursor-based [SCAN](https://redis.io/commands/scan). The Data Explorer will perform SCANS for you in both Redis and Dynomite environments.

![Dynomite Scan](https://github.com/Netflix/nf-data-explorer/blob/master/.github/dyno_scan.gif?raw=true 'Dynomite Scan')

#### Key Edits

Redis has support for rich data structures like lists, maps, and sorted sets. In addition, the Data Explorer supports viewing, creating, editing, and deleting these entities.

![Editing Keys](https://github.com/Netflix/nf-data-explorer/blob/master/.github/redis_hash_key.png?raw=true 'Editing Keys')
