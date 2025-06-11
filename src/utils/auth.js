// src/utils/auth.js
export const isUserAuthenticated = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    const res = await fetch(`${process.env.REACT_APP_BASE_URL}/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) return true;
    // Optional: you could clear localStorage here if token is invalid
    localStorage.removeItem('accessToken');
    return false;
  } catch (error) {
    console.error('Auth check failed', error);
    return false;
  }
};
