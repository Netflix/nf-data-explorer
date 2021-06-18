import CassandraExplorer from '@/services/datastores/cassandra/lib/CassandraExplorer';
import {
  generateCqlStatements,
  generateCsv,
} from '@/services/datastores/cassandra/lib/utils/export-utils';
import {
  CassandraExportFormat,
  ITableColumn,
  ITableSchema,
  IKeyQuery,
} from '@/services/datastores/cassandra/typings/cassandra';
import { IClusterDefinition } from '@/typings/typings';
import { sendFile } from '@/utils/response-utils';
import { Response } from 'express';

// tslint:disable:max-classes-per-file

/**
 * Provides a way to generate an exported version a C* result set.
 * Supports downloading as a file in serveral formats or generating
 * the CQL INSERT statements for the given result set.
 */
export default class CassandraResultsExporter {
  public columns: ITableColumn[] = [];
  public rows: Array<{
    [column: string]: any;
  }> = [];
  public keyQuery: IKeyQuery | undefined = undefined;

  constructor(
    readonly schema: ITableSchema,
    readonly cluster: IClusterDefinition,
    readonly cassandraApi: CassandraExplorer,
  ) {}

  public build(
    columns: ITableColumn[],
    rows: Array<{
      [column: string]: any;
    }>,
    filter: IKeyQuery,
  ): CassandraResultsStream {
    // only include columns available in the schema (this excludes function output)
    const columnNames = new Set(this.schema.columns.map((col) => col.name));
    this.columns = columns.filter((column) => columnNames.has(column.name));
    this.rows = rows;
    this.keyQuery = filter;
    return new CassandraResultsStream(this);
  }
}

class CassandraResultsStream {
  constructor(readonly exporter: CassandraResultsExporter) {}

  /**
   * Send the output of the exporter to the user.
   * @param res The Express Response object.
   * @param format The output format.
   * @param sendAsFile True to send the response as a file download. The file will include the cluster/keyspace/table name.
   */
  public send(
    res: Response,
    format: CassandraExportFormat,
    sendAsFile: boolean,
  ) {
    const { cassandraApi, columns, rows, schema, keyQuery } = this.exporter;

    if (!keyQuery) {
      throw new Error('KeyQuery missing from Exporter');
    }

    let records: string[] = [];
    let content: string;

    const { encoding } = keyQuery.options;
    if (format === 'cql') {
      records = generateCqlStatements(schema, rows, cassandraApi, encoding);
      content = [...records, ''].join(';\n');
    } else if (format === 'csv') {
      content = generateCsv(schema, columns, rows);
    } else {
      throw new Error('Unsupported export format');
    }

    if (sendAsFile) {
      const filename = `${this.generateFilename(format)}.${format}`;
      sendFile(res, 'text/plain', filename, Buffer.from(content, 'utf-8'));
    } else {
      res.json({ records });
    }
  }

  private generateFilename(format: CassandraExportFormat): string {
    const { cluster, keyQuery, schema } = this.exporter;
    const { keyspace, name } = schema;
    const pieces = [cluster.name.toUpperCase(), `${keyspace}.${name}`];
    if (keyQuery && Object.keys(keyQuery.primaryKey).length > 0) {
      pieces.push(
        Object.entries(keyQuery.primaryKey)
          .map(([key, details]) => `${key}.${details.value}`)
          .join('__'),
      );
    }
    if (format === 'cql') {
      pieces.push('insert');
    }
    return pieces.join('____');
  }
}
