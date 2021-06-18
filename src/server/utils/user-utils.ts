import { IRequestUserInfo } from '@sharedtypes/express';
import _ from 'lodash';

function normalizeGroup(userOrGroup: string) {
  const domain = '@netflix.com';
  if (!userOrGroup.endsWith(domain)) {
    return `${userOrGroup}${domain}`;
  }
  return userOrGroup;
}

/**
 * Checks to see if a user is part of the allowed groups. Will check if the allowed groups
 * contains any of the user's groups or user's email address.
 * @param user          The user object from the request. Expected to contain the user's googleGroups.
 * @param allowedGroups The list of allowed groups.
 */
export function isUserAuthorized(
  user: IRequestUserInfo,
  allowedGroups = new Array<string>(),
): boolean {
  if (user.isAdmin) {
    return true;
  }
  if (!user.googleGroups || user.googleGroups.length === 0) {
    throw new Error(
      'Could not find user group information. Please log out and log back in again.',
    );
  }
  const userGroups = _.concat(
    user.email,
    user.googleGroups.map(normalizeGroup),
  );
  return (
    _.intersection(userGroups, allowedGroups.map(normalizeGroup)).length > 0
  );
}
