import {
  storeToken,
  getToken,
  getRefreshToken,
  deleteTokens,
} from "./token.storage";
import {
  getUserData,
  setUserData,
  removeUserData,
} from "./user.storage";

// 1. Re-exporting individual functions with clean explicit names
export {
  storeToken,
  getToken,
  getRefreshToken,
  deleteTokens,
  getUserData,
  setUserData,
  removeUserData,
};

// 2. Convenience Object Exports ( optional for organized calls like tokenStorage.get() )
export const tokenStorage = {
  store: storeToken,
  get: getToken,
  getRefresh: getRefreshToken,
  clear: deleteTokens,
};

export const userStorage = {
  get: getUserData,
  set: setUserData,
  remove: removeUserData,
};