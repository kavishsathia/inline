// A tiny sample file so you can see inline comments render in the dev host.

function fetchUser(id) {
  const res = retry(() => api.get(`/users/${id}`), 3);
  return res.body;
}

function retry(fn, attempts) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

module.exports = { fetchUser, retry };
