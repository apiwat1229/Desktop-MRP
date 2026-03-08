import { defineStore } from 'pinia';
import { getAvatarUrl } from '../lib/utils';
import api, { setAuthToken } from '../services/api';
import { storage } from '../services/storage';
import { useThemeStore } from './theme';

export const useAuthStore = defineStore('auth', {
    state: () => {
        const currentApiBaseUrl = (import.meta.env.VITE_API_URL || '/api').toString();
        const persistedApiBaseUrl = storage.get('apiBaseUrl');

        if (persistedApiBaseUrl !== currentApiBaseUrl) {
            storage.delete('accessToken');
            storage.delete('user');
            storage.set('apiBaseUrl', currentApiBaseUrl);
        }

        const user = storage.get('user') || null;
        const accessToken = storage.get('accessToken') || null;

        // Initialize axios header if we have a persisted token
        if (accessToken) {
            setAuthToken(accessToken);
        }

        return {
            user,
            accessToken,
            tempToken: null as string | null,
        };
    },
    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        userAvatarUrl: (state) => {
            return getAvatarUrl(state.user?.avatar);
        },
        // ... (rest of the getters remain same)
        isAdmin: (state): boolean => {
            const role = state.user?.role || '';
            return ['ADMIN', 'admin', 'Administrator'].includes(role);
        },
        userPermissions: (state): string[] => {
            return state.user?.permissions || [];
        },
        hasPermission: (state) => (permission: string): boolean => {
            const role = state.user?.role || '';
            if (['ADMIN', 'admin', 'Administrator'].includes(role)) return true;
            const permissions = state.user?.permissions || [];
            return permissions.includes(permission);
        },
        hasAnyPermission: (state) => (permissions: string[]): boolean => {
            const role = state.user?.role || '';
            if (['ADMIN', 'admin', 'Administrator'].includes(role)) return true;
            const userPermissions = state.user?.permissions || [];
            return permissions.some(p => userPermissions.includes(p));
        },
        hasAllPermissions: (state) => (permissions: string[]): boolean => {
            const role = state.user?.role || '';
            if (['ADMIN', 'admin', 'Administrator'].includes(role)) return true;
            const userPermissions = state.user?.permissions || [];
            return permissions.every(p => userPermissions.includes(p));
        },
    },
    actions: {
        setTempToken(token: string) {
            this.tempToken = token;
        },
        clearTempToken() {
            this.tempToken = null;
        },
        async login(credentials: any, _rememberMe: boolean = false) {
            try {
                const identifier = String(credentials.email || '').trim();
                const loginPayload = {
                    password: credentials.password,
                    ...(identifier.includes('@')
                        ? { email: identifier }
                        : { username: identifier })
                };

                const response = await api.post('/auth/login', loginPayload);

                this.accessToken = response.data.accessToken;
                this.user = response.data.user;

                // Set token globally in axios
                setAuthToken(this.accessToken);

                // Always persist token and user for session persistence across reloads
                storage.set('accessToken', this.accessToken);
                storage.set('user', this.user);
                storage.set('apiBaseUrl', (import.meta.env.VITE_API_URL || '/api').toString());

                // Load preferences
                const themeStore = useThemeStore();
                themeStore.loadFromUser(this.user);
            } catch (error: any) {
                if (error.response && error.response.data && error.response.data.code === 'MUST_CHANGE_PASSWORD') {
                    this.tempToken = error.response.data.tempToken;
                    throw error;
                }
                console.error('Login failed:', error);
                throw error;
            }
        },
        async fetchUser() {
            try {
                const response = await api.get('/auth/me');
                this.user = response.data;

                const themeStore = useThemeStore();
                themeStore.loadFromUser(this.user);

                if (storage.get('accessToken')) {
                    storage.set('user', this.user);
                }
            } catch (error) {
                console.error('Fetch user failed:', error);
            }
        },
        logout() {
            this.user = null;
            this.accessToken = null;
            setAuthToken(null);
            storage.delete('accessToken');
            storage.delete('user');
            storage.set('apiBaseUrl', (import.meta.env.VITE_API_URL || '/api').toString());
        }
    }
});
