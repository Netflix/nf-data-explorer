export async function fetchUserInfo(): Promise<any> {
  return Promise.resolve({
    access_token: 'abcdef.ghijk.lmnop',
    userinfo: {
      email: 'testuser@netflix.com',
      googleGroups: [],
    },
  });
}
