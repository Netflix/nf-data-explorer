import { t } from '@/i18n';

interface IRestrictedQuery {
  message: string;
  regex: string;
}

export function getRestrictedQueries(): IRestrictedQuery[] {
  return [
    {
      message: t('query.queryNotSupported', {
        command: 'ALTER',
      }),
      regex: 'alter\\s+(keyspace|table|user)',
    },
    {
      message: t('query.queryNotSupported', { command: 'BATCH' }),
      regex: 'begin\\s+batch',
    },
    {
      message: t('query.queryNotSupported', { command: 'CREATE INDEX' }),
      regex: 'create\\s+(custom\\s)?index',
    },
    {
      message:
        'Using "DROP TABLE" is not recommended. Please visit the table detail view where the DROP TABLE wizard will assist you.',
      regex: 'drop\\s+table',
    },
    {
      message: t('query.queryNotSupported', { command: 'DROP' }),
      regex: 'drop\\s+(index|keyspace|user)',
    },
    {
      message: t('query.queryNotSupported', { command: 'GRANT' }),
      regex: 'grant\\s+(all|alter|authorize|create|drop|modify|select)',
    },
    {
      message: t('query.queryNotSupported', { command: 'LIST' }),
      regex: 'list\\s+(permissions|users)',
    },
    {
      message: t('query.queryNotSupported', { command: 'REVOKE' }),
      regex: 'revoke\\s+(all|alter|authorize|create|drop|modify|select)',
    },
    {
      message: t('query.queryNotSupported', { command: 'USE KEYSPACE' }),
      regex: 'use\\s+\\w+$',
    },
    {
      message: `Using "CREATE KEYSPACE" is not recommended. Please visit the list of keyspaces where
    you can create a new keyspace using the recommended settings.`,
      regex: 'create\\s+keyspace',
    },
    {
      message: `Using "CREATE TABLE" is not recommended. Please visit the list of tables in the
    keyspace where you want to create your new table. The CREATE TABLE wizard will assist you
    with creating your new table.`,
      regex: 'create\\s+table',
    },
    {
      message: t('query.queryNotSupported', { command: 'TRUNCATE' }),
      regex: 'truncate\\s+',
    },
  ];
}
