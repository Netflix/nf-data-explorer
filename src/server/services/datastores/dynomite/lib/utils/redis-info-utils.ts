import setupLogger from '@/config/logger';
import { IDynomiteInfo } from '@/services/datastores/dynomite/typings/dynomite';
const logger = setupLogger(module);

/**
 * Parses a Dynomite/Redis info string.
 * @param   infoString  The result of the INFO command.
 * @returns Returns an object where the keys are the sections from the INFO command.
 * @private
 */
export function parseInfoString(infoString: string): IDynomiteInfo {
  const sections = infoString.split('#');
  const data = {};
  sections.forEach((sectionText) => {
    const text = sectionText.trim();
    if (text.length === 0) {
      return;
    }

    const pieces = text.split(/\r\n/);
    const sectionName = pieces[0];
    const sectionData = {};
    data[sectionName] = sectionData;

    for (let i = 1; i < pieces.length; i++) {
      const pair = pieces[i].split(':');
      const key = pair[0];
      const value = pair[1];
      sectionData[key] = value;
    }
  });
  return data;
}

/**
 * Helper method for extracting the key count from the string output of the Redis `info` command.
 * @param infoString Output of the `info` command.
 */
export function getKeyCountFromInfo(infoString: string): number {
  const instanceInfo = parseInfoString(infoString);
  if (!instanceInfo.Keyspace || !instanceInfo.Keyspace.db0) {
    return 0;
  }

  const keyString = instanceInfo.Keyspace.db0;
  const re = /keys=(\d*)/;
  const matches = re.exec(keyString);
  if (!matches || matches.length !== 2) {
    logger.error(
      `Invalid keyspace string. Unable to extract key count from: ${keyString}`,
    );
    throw new Error('Invalid keyspace string');
  }
  const keys = matches[1];
  return +keys;
}
