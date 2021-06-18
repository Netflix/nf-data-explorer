# Contributing to the Netflix Data Explorer

🎉 Thanks for considering a contribution! 🎉

Here are some guidelines for contributing to the project.

- [ Issue Reporting Guidelines ](#issue-reporting-guidelines)
- [ Pull Request Guidelines](#pull-requiest-guidelines)
- [ Development Setup ](#development-setup)

### Issue Reporting Guidelines

Please [file an issue](https://github.com/Netflix/nf-data-explorer/issues/new/choose) if you find any bugs.

## Pull Request Guidelines

### RFCs for New Features

We highly recommend creating a Request For Comments (RFC) for new features. A proposed new feature may not align with the intended direction of the Data Explorer and may be declined. To be as transparent as possible and save any potential wasted time and frustration we recommend sharing a short write up of your proposed feature.

### General Guidelines

- Create a topic branch for your work (please do not submit PRs against the `master` branch).

## Project Structure

- **`dist`**: contains the built files for the app

- **`install`**: contains the CLI setup tool

  Users can run `yarn setup` to initialize a configuration file for their environment.

- **`src`**: contains all project source code

  - **`client`**: contains the Vue.js based client code

    - **`dist`**: contains built files for distribution.

    - **`src`**: contains all client project source.

      - **`assets`**: contains non-JS assets like images and stylesheets.

      - **`components`**: contains Vue components

      - **`filters`**: contains [Vue filters](https://vuejs.org/v2/guide/filters.html)

      - **`i18n`**: contains internationalization support

        Custom messages are provide in some instances to allow for more tailored environment-specific messages. Note: we don't have all messages translated. You can create your own custom locale (e.g. `en-ACME.ts`) using `en-US.ts` as a starting point.

      - **`models`**: contains some custom model objects.

      - **`router`**: contains [Vue Router](https://router.vuejs.org/) configuration.

      - **`services`**: contains service code.

        Contains all the code responsible for making the HTTP requests to the server.

      - **`setup`**: contains app setup code.

        - `setup/dynamic-components.ts`: used to register dynamic components

          This allows us to use different components at runtime.

      - **`shared`**: contains shared server code (note, generated at build time).

        This directory contains code that is copied over from the `/src/server` directory at build time.

      - **`store`**: contains [Vuex Store](https://vuex.vuejs.org/)

        Client-side state management is handled by Vuex (similar to Redux).

      - **`typings`**: contains client-side TypeScript type definitions.

      - **`utils`**: contains utility libraries.

      - **`validators`**: contains validators

      - **`views`**: contains top-level View components

        `views` are similar to `components`. The general distinction here is that Views are routable-components (i.e. the `router` directory will contain route definitions that will render one of these top-level Views).

  - **`server`**: contains the Node.js based server code

    - **`config`**: contains all server configuration code.

      An important aspect here is the `overrides` directory which will contain your environment-specific overrides to the base configuration specified in `base-config.ts`. Note, you shouldn't have to modify the configuration by hand as we have a CLI that will generate it for you (see `yarn setup`).

    - **`i18n`**: contains server-side translations of messages.

      If your environment requires more specific messages, you can create your own locale file (e.g. `en-ACME.ts`). You can use `en-US.ts` as a starting point.

    - **`model`**: contains server-side model objects and custom Errors.

    - **`public`**: contains the serve-able HTML content.

      Initially empty, after a full build this directory will contain the content that will be served up to your browser.

    - **`routes`**: contains all the Express routes.

    - **`services`**: contains all the services.

      Many of these services are exposed with seams for you to provide your own implementation. They server functions like `discovery` of clusters, fetching of `access control`, and performing datastore-specific interactions.

    - **`shared`**: contains shared runtime code between the server and client.

      Since we use TypeScript on both the client and server, it's possible to have some shared code that's used at runtime. During the build, shared code in the server directory is copied into a directory accessible by the client.

    - **`typings`**: contains shared type definitions between the server and client.

      Since we use TypeScript on both the client and server, we share many type definitions on both sides. When introducing new types, think about if they are used on the server, the client, or **both**.

    - **`utils`**: contains a collection of utility functions

## Discovery Service

We support several options for discovering your datastore clusters. Running `yarn setup` will prompt you for the discovery mechanism to use.

![Yarn Setup Discovery](https://github.com/Netflix/nf-data-explorer/blob/master/.github/yarn_setup_discovery.png?raw=true 'Yarn Setup Discovery')

1. **`localhost`**

   - Used in scenarios where you have the datastore running locally.

2. **`environment variables`**

   - Supports a single C\* and/or single Dynomite/Redis cluster. Convenient when you want to point to a remote system.

3. **`file system`**

   - Watch a local file that contains the cluster names and host/IP information. Most suited for a production environment where you have many clusters in your fleet.

4. **`custom`**

- Implement your own discovery service provider to fetch cluster names and host/IP information from a remote service. This is the type of configuration used by Netflix.

### Discovery Format

Note, if you are selecting the **`file system`** or **`custom`** option above. You will be expected to either provide a file (file system) or response (custom) in the following format.

```json
[
  {
    "name": "MY_CLUSTER_A",
    "env": "test",
    "region": "us-east-1",
    "datastoreType": "cassandra",
    "instances": [
      {
        "az": "us-east-1e",
        "hostname": "ip-abc.ec2.internal",
        "ip": "100.1.1.1",
        "region": "us-east-1",
        "status": "UP"
      },
      {
        "az": "us-east-1e",
        "hostname": "ip-def.ec2.internal",
        "ip": "100.1.1.2",
        "region": "us-east-1",
        "status": "UP"
      }
    ]
  }
]
```

There is a published [JSON schema ](https://github.com/Netflix/nf-data-explorer/blob/master/schema/discovery-schema.json) that will help validate your discovery file. If you use VS Code (highly recommended), the workspace is pre-configured to validate your discovery file when you create a file with a name ending in `...discovery.json`.

If implementing your own custom discovery provider by implementing a [CustomDiscoveryProvider](https://github.com/Netflix/nf-data-explorer/blob/master/src/server/services/discovery/providers/CustomDiscoveryProvider.ts), you will be responsible for providing the cluster definitions.

```typescript
export type DatastoreType = 'cassandra' | 'dynomite';
export interface IClusterDefinition {
  /** The name of the datastore (e.g. `CASS_CLUSTER`) */
  name: string;
  /** The environment this cluster belongs to (e.g. `TEST` or `PROD`) */
  env: string;
  /** The cloud provider region the cluster is deployed in (e.g. `us-east-1`) */
  region: string;
  /** The type of datastore (e.g. `cassandra`) */
  datastoreType: DatastoreType;
  /** The list of individual instances/nodes */
  instances: IInstanceDefinition[];
}
```

#### Discovery Region and Cassandra Datacenter

Note, for Cassandra, the `region` returned for each cluster is expected to match the `datacenter` value used for the cluster (this can be found in the `system.peers` table).

If the format doesn't match exactly, you will not be able to connect and will see "no hosts available" errors. If you need to transform the `region` to match the `datacenter` (e.g. region is `us-east-1`, but datacenter is `us-east`), you can provide a custom implementation of [ICassandraClientOptionsProvider](https://github.com/Netflix/nf-data-explorer/blob/master/src/server/services/datastores/cassandra/lib/providers/client/ICassandraClientOptionsProvider.ts#L7).
