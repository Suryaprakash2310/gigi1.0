export const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://10.242.126.29:4000/api' // 👈 Replace with your system IP
    : 'https://gigiman1.onrender.com/api';
// 10.175.221.153 //172.17.10.165