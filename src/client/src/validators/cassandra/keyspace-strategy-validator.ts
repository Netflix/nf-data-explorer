import i18n from '@/i18n';
import {
  IDatacenter,
  IKeyspace,
  IKeyspaceStrategyOptions,
} from '@cassandratypes/cassandra';

export interface IKeyspaceValidationResult {
  valid: boolean;
  message?: string;
  detail?: string;
}

function validateNetworkTopologyStrategy(
  options: IKeyspaceStrategyOptions,
  datacenters: IDatacenter[],
  isLocal: boolean,
): IKeyspaceValidationResult {
  const replication = Object.keys(options).map((option) => ({
    name: option,
    racks: +options[option],
  }));
  const invalidRegions = new Array<{
    name: string;
    detail: string;
  }>();
  replication.forEach((rep) => {
    const { name, racks } = rep;
    const datacenter = datacenters.find((dc) => dc.name === name);
    if (!datacenter) {
      invalidRegions.push({
        name,
        detail: `Region "${name}" is not available`,
      });
    } else if (racks <= 0 || racks > datacenter.racks.length) {
      invalidRegions.push({ name, detail: `Invalid rack value: ${racks}` });
    } else if (racks !== 3 && !isLocal) {
      invalidRegions.push({
        name,
        detail: `A rack value of 3 should be used instead of ${racks}`,
      });
    }
  });
  invalidRegions.sort((a, b) => a.name.localeCompare(b.name));

  if (invalidRegions.length === 0) {
    return { valid: true };
  } else {
    return {
      valid: false,
      message: 'NetworkTopologyStrategy is not configured correctly.',
      detail: invalidRegions[0].detail,
    };
  }
}

export function validateKeyspace(
  keyspace: IKeyspace,
  availableDatacenters: IDatacenter[],
  isLocal: boolean,
): IKeyspaceValidationResult {
  if (!keyspace) {
    return { valid: false };
  }
  if (keyspace.name.toLowerCase().startsWith('system_')) {
    return { valid: true };
  }

  const { strategy, strategyOptions } = keyspace;
  if (strategy === 'SimpleStrategy') {
    return {
      valid: false,
      message: i18n.t('errors.simpleStrategyNotRecommended.message') as string,
      detail: i18n.t('errors.simpleStrategyNotRecommended.detail') as string,
    };
  } else if (strategy === 'NetworkTopologyStrategy') {
    return validateNetworkTopologyStrategy(
      strategyOptions,
      availableDatacenters,
      isLocal,
    );
  }
  return { valid: true };
}
