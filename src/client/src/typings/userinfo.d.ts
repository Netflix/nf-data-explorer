export interface IUserInfo {
  access_token: string;
  access_token_expires: string;
  refresh_token: string;
  userinfo: {
    email: string;
    familyName: string;
    fullName: string;
    givenName: string;
    googleGroups: string[];
    preferred_username: string;
    sub: string;
    userId: string;
  };
}
