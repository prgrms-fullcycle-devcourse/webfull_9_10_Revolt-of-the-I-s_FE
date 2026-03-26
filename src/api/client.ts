import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://i-station.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키를 함께 보내기 위한 설정
})