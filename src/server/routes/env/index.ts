import { APP_ENV, APP_REGION } from '@/config/constants';
import setupLogger from '@/config/logger';
import { IRegionInfo } from '@/typings/typings';
import {
  getAllKnownEnvironments,
  getAllKnownRegions,
  getAppStack,
  getAvailableClusters,
  getEnv,
  getRegion,
} from '@/utils/app-utils';
import { Router } from 'express';
import _ from 'lodash';
import { getConfig } from '@/config/configuration';

const logger = setupLogger(module);

const router = Router();

const { CLUSTER_REDIRECT_HOST } = getConfig();

function getRedirectHost(host: string, region: string, env: string): string {
  return CLUSTER_REDIRECT_HOST.replace(
    /(:appName)|(:regionName)|(:accountName)/g,
    (
      _match: string,
      appName: string,
      regionName: string,
      accountName: string,
    ): string => {
      if (appName) return host;
      if (regionName) return region;
      if (accountName) return env;
      return '';
    },
  );
}

/**
 * Fetch all the available regions as well as the name of the current environment and region.
 */
router.get('/regions', (req, res) => {
  const available = new Array<{
    env: string;
    region: string;
  }>();
  const knownRegions = getAllKnownRegions();
  const knownEnvironments = getAllKnownEnvironments();
  knownRegions.sort().forEach((regionName) => {
    knownEnvironments.forEach((envName) => {
      available.push({ env: envName, region: regionName });
    });
  });
  res.json({
    available: _.sortBy(available, ['env', 'region']),
    current: {
      env: getEnv(req.app),
      region: getRegion(req.app),
    },
  });
});

/**
 * Request to change regions.
 *
 * By POSTing to this endpoint, the caller will be redirected to the app running in the given region.
 * A session cookie will also be set with the current requester's JWT. This can be then be sent via
 * the Authorization header by your app.
 */
router.post('/regions/:regionInfo', (req, res) => {
  const datastoreType = req.body.datastoreType;
  if (!datastoreType || datastoreType.length === 0) {
    return res.status(400).json({ message: 'Datastore type is required' });
  }

  const availableEnvironments = getAllKnownEnvironments();
  const availableRegions = getAllKnownRegions();
  const regionInfo = req.params.regionInfo.toLowerCase();
  const re = new RegExp(`^(${availableEnvironments.join('|')})-(.*)$`);
  const matches = re.exec(regionInfo);
  if (!matches || matches.length !== 3) {
    logger.error(
      `Failed to switch to region ${regionInfo}. Available environments: ${JSON.stringify(
        availableEnvironments,
      )}; available regions: ${JSON.stringify(availableRegions)}`,
    );
    return res
      .status(400)
      .json({ message: `Invalid region info: '${regionInfo}'` });
  }

  const envName = matches[1];
  const regionName = matches[2];
  if (availableRegions.indexOf(regionName) < 0) {
    return res
      .status(404)
      .json({ message: `Could not find given region: ${regionName}` });
  }
  const optionalCluster = req.body.cluster
    ? `/clusters/${req.body.cluster}`
    : '';
  let url: string;
  if (process.env.NODE_ENV === 'development') {
    logger.info(
      `DEV MODE - switching server region/env to: ${regionName}/${envName}.`,
      req,
    );
    req.app.set(APP_ENV, envName);
    req.app.set(APP_REGION, regionName);
    url = `${req.headers.origin}/${datastoreType}${optionalCluster}`;
  } else {
    const cluster = getAppStack(req.app);
    const redirectHost = getRedirectHost(cluster, regionName, envName);
    url = `${redirectHost}/${datastoreType}${optionalCluster}`;
  }
  res.setHeader('location', url);
  res.json({ location: url });
});

/**
 * Fetches the list of environment/region combinations for a given cluster.
 */
router.get('/regions/:datastoreType/:clusterName', (req, res, next) => {
  try {
    const availableClusters = getAvailableClusters(req.params.datastoreType);
    const items: IRegionInfo[] = availableClusters
      .filter((item) => item.name === req.params.clusterName)
      .map((item) => ({ region: item.region, env: item.env }));
    res.json(_.sortBy(items, ['env', 'region']));
  } catch (err) {
    next(err);
  }
});

export default router;
