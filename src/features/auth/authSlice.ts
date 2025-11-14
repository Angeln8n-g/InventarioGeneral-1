import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/services/api'
import type { AuthUser, AuthState } from '@/types/auth'

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearError: (state) => {
      state.error = null
    },
    loadFromStorage: (state) => {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        state.token = token
        state.user = JSON.parse(user)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.login.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(api.endpoints.login.matchFulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addMatcher(api.endpoints.login.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })
      .addMatcher(api.endpoints.logout.matchFulfilled, (state) => {
        state.user = null
        state.token = null
        state.error = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
  },
})

export const { logout, clearError, loadFromStorage } = authSlice.actions
export default authSlice.reducer