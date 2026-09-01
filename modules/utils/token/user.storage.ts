export const setUserData = (user: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("SkyTech-portal-user", JSON.stringify(user));
  }
};

export const getUserData = (): Record<string, unknown> | null => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("SkyTech-portal-user");
    return user ? JSON.parse(user) : null;
  }

  return null;
};

export const removeUserData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("SkyTech-portal-user");
  }
};
