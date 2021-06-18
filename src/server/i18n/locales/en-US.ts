// NOTE: we allow HTML characters in error remediation messages only as these are presented unescaped to users.
// any variable interpolation used with remediation messages must be escaped.
export default {
  message: 'Hello world',
  query: {
    queryNotSupported:
      '"{{ command }}" is not supported. Please contact your administrator.',
  },
  errors: {
    clusterNotAuthorizedError: {
      remediation: `You do not have access to cluster {{ clusterName }}. You do not belong to a google group that has
      been given access to this cluster. Please see your administrator.`,
    },
    entityNotAuthorizedError: {
      title: 'User does not have access to {{ entityType }} {{ entityName }}',
      message: 'User does not have access to {{ entityType }} {{ entityName }}',
      selfServiceToolName: 'Self-service tool',
      selfServiceToolUrl:
        'https://acme.net/{{ datastoreType, lowercase }}/clusters/{{ clusterName, lowercase }}/{{ clusterEnv, lowercase }}',
      remediation: `You do not have access to {{ entityType }} {{ entityName }}. You do not belong to a google group that has
        been given access to this {{ entityType }}. If you have recently joined a Google group, try logging
        out and logging back in.If you need access to this cluster, you can add yourself as an owner via the
        {{ toolName }}: {{- toolUrl }}`,
    },
    keyspaceNotAccessible: {
      title: 'User does not have access to Keyspace "{{ keyspaceName }}"',
      message: 'User does not have access to Keyspace "{{ keyspaceName }}"',
      remediation: `You do not have access to {{ entityType }} {{ entityName }}. You do not belong to a google group that has
                    been given access to this {{ entityType }}.`,
    },
    fileUploadError: {
      tooLargeRemediation:
        'Please choose a smaller file to upload or contact your administrator for help uploading larger files.',
      defaultRemediation:
        'Please contact your administrator for help uploading your file.',
    },
    cassandraAuthenticationError: {
      remediation:
        'Authenticated clusters are not currently supported. Please contact your administrator.',
    },
    cassandraNoHostAvailableError: {
      remediation:
        'No hosts were available for this cluster. Please make sure your Cassandra cluster is available on the specified port. If you just started the Cassandra server, you may need to wait for it to finish starting.',
    },
    operationNotSupportedInEnvError: {
      remediation:
        'Please check if you are accessing the correct environment {{ env }}. If you intended to perform this operation in this environment, please see your administrator.',
    },
  },
};
