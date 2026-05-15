import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

let refreshing = null;
let queue = [];

const drain = (err, token) => { queue.forEach(cb => cb(err, token)); queue = []; };

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err);
    const redirectToLogin = () => {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    };

    if (orig.url === '/auth/refresh') {
      redirectToLogin();
      return Promise.reject(err);
    }
    orig._retry = true;
    if (refreshing) {
      return new Promise((res, rej) => queue.push((e, _) => e ? rej(e) : res(api(orig))));
    }
    refreshing = api.post('/auth/refresh').then(() => {
      drain(null);
      refreshing = null;
    }).catch(e => {
      drain(e);
      refreshing = null;
      redirectToLogin();
      return Promise.reject(e);
    });
    return refreshing.then(() => api(orig));
  }
);

export default api;
