function parseCookies(cookies) {
  const cookieObj = {};

  if (cookies) {
    cookies.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.split('=');
      const trimmedName = name?.trim();
      if (!trimmedName) return;
      const value = rest.join('=').trim();
      if (!value) return;
      cookieObj[trimmedName] = value;
    });
  }

  return cookieObj;
}

module.exports = { 
  parseCookies,
};