import { getConfig } from '@/config/configuration';

const { ADMIN_GROUPS, ADMIN_USERS } = getConfig();

const ADMIN_GROUP_SET = new Set(ADMIN_GROUPS);
const ADMIN_USER_SET = new Set(ADMIN_USERS);

/**
 * Checks if the given user email and google groups permit administrator access.
 * @param email The user's email address.
 * @param userGroups The user's google groups.
 * @returns True if the user is an administrator. False otherwise.
 */
export function isAdministrator(email: string, userGroups: string[]): boolean {
  let isAdminGroupMember = false;
  const userGroupSet = new Set(userGroups);
  for (const adminGroup of ADMIN_GROUP_SET) {
    if (userGroupSet.has(adminGroup)) {
      isAdminGroupMember = true;
      break;
    }
  }
  return isAdminGroupMember || ADMIN_USER_SET.has(email);
}
