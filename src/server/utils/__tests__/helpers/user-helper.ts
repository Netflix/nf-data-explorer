import { IRequestUserInfo } from '@sharedtypes/express';

const baseUser: IRequestUserInfo = {
  email: 'TBD',
  application: 'nfdataexplorer2',
  googleGroups: [],
  isAdmin: false,
};

export function createTestUser(
  email: string,
  groups: string[],
): IRequestUserInfo {
  return {
    ...baseUser,
    email,
    googleGroups: groups,
  };
}
