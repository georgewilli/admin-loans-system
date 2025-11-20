import { AuthProvider } from 'react-admin';

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        const request = new Request('http://localhost:3000/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        const response = await fetch(request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText);
        }
        const auth = await response.json();
        localStorage.setItem('auth', JSON.stringify(auth));
        return Promise.resolve();
    },

    logout: () => {
        localStorage.removeItem('auth');
        return Promise.resolve();
    },

    checkAuth: () => {
        return localStorage.getItem('auth')
            ? Promise.resolve()
            : Promise.reject();
    },

    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('auth');
            return Promise.reject();
        }
        return Promise.resolve();
    },

    getIdentity: () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            return Promise.resolve({
                id: auth.user?.id,
                fullName: auth.user?.email,
            });
        } catch (error) {
            return Promise.reject(error);
        }
    },

    getPermissions: () => Promise.resolve(''),
};
