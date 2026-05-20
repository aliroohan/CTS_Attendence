import axios from 'axios';

// Change this to your backend URL
const API_URL = 'https://creativetech99-attendence.hf.space/api'; // Update with your machine's IP


const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s timeout for image uploads
});

export default api;
