import { fetchUtils, DataProvider } from 'react-admin';

const apiUrl = 'http://localhost:3000';

const httpClient = (url: string, options: fetchUtils.Options = {}) => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    const token = auth.access_token;

    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }

    if (token) {
        (options.headers as Headers).set('Authorization', `Bearer ${token}`);
    }

    return fetchUtils.fetchJson(url, options);
};

export const dataProvider: DataProvider = {
    getList: (resource, params) => {
        const url = `${apiUrl}/${resource}`;
        return httpClient(url).then(({ json }) => ({
            data: json,
            total: json.length,
        }));
    },

    getOne: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
            data: json,
        })),

    getMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const url = `${apiUrl}/${resource}?${fetchUtils.queryParameters(query)}`;
        return httpClient(url).then(({ json }) => ({ data: json }));
    },

    getManyReference: (resource, params) => {
        const query = {
            filter: JSON.stringify({
                ...params.filter,
                [params.target]: params.id,
            }),
        };
        const url = `${apiUrl}/${resource}?${fetchUtils.queryParameters(query)}`;
        return httpClient(url).then(({ json }) => ({
            data: json,
            total: json.length,
        }));
    },

    create: (resource, params) =>
        httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: json,
        })),

    update: (resource, params) => {
        // Payments, disbursements, and repayments are immutable
        if (resource === 'payments' || resource === 'disbursements' || resource === 'repayments') {
            return Promise.reject(new Error(`${resource} are immutable and cannot be updated`));
        }

        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PATCH',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }));
    },

    updateMany: (resource, params) => {
        // Payments, disbursements, and repayments are immutable
        if (resource === 'payments' || resource === 'disbursements' || resource === 'repayments') {
            return Promise.reject(new Error(`${resource} are immutable and cannot be updated`));
        }

        return Promise.all(
            params.ids.map(id =>
                httpClient(`${apiUrl}/${resource}/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(params.data),
                })
            )
        ).then(responses => ({ data: responses.map(({ json }) => json.id) }));
    },

    delete: (resource, params) => {
        // Payments, disbursements, and repayments are immutable
        if (resource === 'payments' || resource === 'disbursements' || resource === 'repayments') {
            return Promise.reject(new Error(`${resource} are immutable and cannot be deleted`));
        }

        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json }));
    },

    deleteMany: (resource, params) => {
        // Payments, disbursements, and repayments are immutable
        if (resource === 'payments' || resource === 'disbursements' || resource === 'repayments') {
            return Promise.reject(new Error(`${resource} are immutable and cannot be deleted`));
        }

        return Promise.all(
            params.ids.map(id =>
                httpClient(`${apiUrl}/${resource}/${id}`, {
                    method: 'DELETE',
                })
            )
        ).then(responses => ({ data: responses.map(({ json }) => json.id) }));
    },
};
