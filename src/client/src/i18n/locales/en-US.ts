export default {
  nav: {
    help: {
      chat: {
        href: 'https://aol/im',
        label: 'Chat',
      },
      documentation: {
        href: 'http://acme.com/docs',
        label: 'Documentation',
      },
      email: {
        href: 'mailto:admin@acme.com',
        label: 'Email',
      },
    },
  },
  datastores: {
    cassandra: {
      description:
        'Cassandra is a distributed, decentralized, fault tolerant, eventually consistent, linearly scalable, and column-oriented data store.',
    },
    dynomite: {
      description:
        'Low-latency, in-memory datastore with support for multi-datacenter replication and high availability.',
    },
  },
  cassandra: {
    keyspaces: {
      sharedCluster: {
        title: 'Shared Cluster',
        message:
          'This is a shared cluster. If you do not see a keyspace you are looking for, you may not have access to it. Ownership is managed via {0}.',
        link: {
          href:
            'https://acme.com/cassandra/clusters/{cluster}/{env}/keyspaces/{region}',
          label: 'Self Service',
        },
      },
    },
    tables: {
      sharedCluster: {
        tableNotFound: {
          message:
            'Note: This is a shared cluster. You may not have access to this keyspace. Ownership is managed via {0}.',
          link: {
            href:
              'https://acme.com/cassandra/clusters/{cluster}/{env}/keyspaces/{region}',
            label: 'Self Service',
          },
        },
      },
    },
    createTable: {
      errors: {
        blobPrimaryKey:
          'Using Blob columns in the primary key is strongly discouraged. Most tools will provide limited support. It is recommended that you split up your primary key into strongly typed columns.',
      },
      warnings: {
        counters:
          'Counters should only be used in rare instances due to concerns about performance and accuracy.',
      },
    },
    dropTable: {
      errors: {
        noMetricsAvailable:
          'Unable to load usage metrics for this table. Unable to drop table. Please contact your administrator for assistance.',
      },
    },
    strategies: {
      compaction: {
        sizeTieredCompactionStrategy: {
          pros: [
            'Write once workloads',
            'Best general purpose strategy on old Cassandra clusters (2.x)',
          ],
          cons: [
            'Read latency sensitive workloads',
            'Update (writes to existing partitions) workloads',
          ],
        },
        leveledCompactionStrategy: {
          pros: [
            'Read latency sensitive workloads',
            'Update (writes to existing partitions) workloads',
            'TTL workloads with mutable data',
            'Best general purpose strategy on modern Cassandra (3.0+)',
          ],
          cons: [
            'Time series or write once workloads',
            'Per node datasets > 200GB on 2.x; 3.0+ is fine',
          ],
        },
        timeWindowCompactionStrategy: {
          pros: [
            'Time series data',
            'Data must be immutable',
            'Known TTL',
            'Known query buckets',
          ],
          cons: [],
        },
      },
    },
    speculativeRetry: {
      description:
        'To improve the overall latency, the driver can submit the query against an additional node. This will cause additional individual requests to be made to the cluster. Generally the specified default value is appropriate. Note: defaults to NONE when TimeWindowCompactionStrategy is used.',
    },
  },
  clusterList: {
    noClusters: {
      title:
        'If you can not find a cluster you are looking for, you may not belong to the necessary Google group.',
      link: {
        href: 'https://acme.net/',
        label: 'Your app',
      },
      remediation: 'Check {0} to see which groups are listed as owners.',
    },
  },
  help: {
    cassandra: {
      placeholder: 'Placeholder help text',
      limitedSchema:
        'In order to view all columns, please choose a "Blob Encoding" using the appropriate encoding option.',
    },
    general: {
      contactAdministrator: 'Please contact your administrator for assistance',
    },
  },
  errors: {
    simpleStrategyNotRecommended: {
      message: 'SimpleStrategy is not recommended for production.',
      detail:
        'You may have trouble querying this keyspace and your data is not protected.',
    },
  },
};
