import { getConfig } from '@/config/configuration';
import AuthenticationError from '@/model/errors/AuthenticationError';
import { IRequestUserInfo } from '@/typings/express';
import { isAdministrator } from '@/utils/auth-utils';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import { hidePoweredBy } from 'helmet';
import path from 'path';
import { getUserGroupCache } from './services';

async function getUserFromRequest(req: Request): Promise<IRequestUserInfo> {
  const {
    REQUEST_HEADER_ACCESS_TOKEN,
    REQUEST_HEADER_CLIENT_APP,
    REQUEST_HEADER_CLIENT_CERT_VERIFY,
    REQUEST_HEADER_EMAIL,
  } = getConfig();

  const email = req.header(REQUEST_HEADER_EMAIL) as string;
  const isCertificateValid =
    req.header(REQUEST_HEADER_CLIENT_CERT_VERIFY) === 'SUCCESS';

  if (!email && !isCertificateValid) {
    throw new AuthenticationError(
      'Failed to authenticate due to missing token',
      'Please specify a user or certificate token',
    );
  }

  if (email) {
    const application = req.header(REQUEST_HEADER_CLIENT_APP) as string;
    const accessToken = req.header(REQUEST_HEADER_ACCESS_TOKEN) as string;
    const googleGroups = await getUserGroupCache().getUserGroups(
      email,
      accessToken,
    );
    return {
      email,
      application,
      googleGroups,
      isAdmin: isAdministrator(email, googleGroups),
    };
  } else {
    return {
      email,
      application: email,
      googleGroups: [],
      isAdmin: true,
    };
  }
}

async function userMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const { REQUIRE_AUTHENTICATION } = getConfig();
  try {
    if (REQUIRE_AUTHENTICATION) {
      req.user = await getUserFromRequest(req);
    }
    next();
  } catch (err) {
    next(err);
  }
}

function redirectHttpToHttps(req: Request, res: Response, next: NextFunction) {
  if (
    process.env.NODE_ENV !== 'production' ||
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.url.match(/^(\/REST)?\/healthcheck/)
  ) {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
}

export function setupMiddleware(app: Express): void {
  app.use(hidePoweredBy());
  app.use(compression());
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(userMiddleware);
  app.use(redirectHttpToHttps);
}
