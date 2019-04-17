import axios from 'axios'

const baseUrl = 'http://122.152.201.59:8000/api'

export function authenticate (params) {
  return axios.post(baseUrl + '/authenticate', {
    username: params.username,
    password: params.password
  })
}

export function getUserInfo (token) {
  return axios.get(baseUrl + '/note/user/userInfo', {
    headers: {
      'Authorization': 'Bearer' + token
    }
  })
}

export function pullNotebooks (token) {
  return axios.get(baseUrl + '/noteBook/notebooks', {
    headers: {
      'Authorization': 'Bearer' + token
    }
  })
}

export function pullNote (token) {
  return axios.get(baseUrl + '/note/pullNote', {
    headers: {
      'Authorization': 'Bearer' + token
    }
  })
}

export function pushNotebook (token, params) {
  console.log('pushNotebook', token, params)
  return axios.post(baseUrl + '/noteBook/pushNotebook', params, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer' + token
    }
  })
}

export function pushNote (token, params) {
  console.log('pushNote', token, params)
  return axios.post(baseUrl + '/note/pushNote', params, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer' + token
    }
  })
}