import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://schoolapp-a23h.onrender.com', // change if needed
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  /*console.log('API TOKEN =>', token);*/

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export default api;
