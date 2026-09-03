import { IUser } from "../../auth/auth.types";

const USER_KEY = "MohamedTransit-portal-user";

export const setUserData = (user: IUser) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to set user data in localStorage:", error);
    }
  }
};

export const getUserData = (): IUser | null => {
  if (typeof window !== "undefined") {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Failed to get user data from localStorage:", error);
      return null;
    }
  }
  return null;
};

export const removeUserData = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error("Failed to remove user data from localStorage:", error);
    }
  }
};