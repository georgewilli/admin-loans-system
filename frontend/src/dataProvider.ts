import { fetchUtils, DataProvider } from 'react-admin';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';


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
        const page = params.pagination?.page || 1;
        const perPage = params.pagination?.perPage || 50;

        const query = {
            page: page.toString(),
            limit: perPage.toString(),
        };

        const url = `${apiUrl}/${resource}?${fetchUtils.queryParameters(query)}`;

        return httpClient(url).then(({ json }) => {
            // Backend now returns paginated response: { data, total, page, pageSize, totalPages }
            // Check if it's the new format or old format (for backwards compatibility)
            if (json.data && json.total !== undefined) {
                // New paginated format
                return {
                    data: json.data,
                    total: json.total,
                };
            } else {
                // Old format (fallback for endpoints not yet paginated)
                return {
                    data: json,
                    total: json.length,
                };
            }
        });
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
        }).then(({ json }) => {
            // Backend returns { loan }, { disbursement }, etc.
            // Extract the actual data object
            const dataKey = Object.keys(json).find(key =>
                typeof json[key] === 'object' && json[key] !== null
            );
            const data = dataKey ? json[dataKey] : json;

            return { data };
        }),

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
        // Payments, disbursements, repayments, and loans are immutable
        if (resource === 'payments' || resource === 'disbursements' || resource === 'repayments' || resource === 'loans') {
            return Promise.reject(new Error(`${resource} are immutable and cannot be deleted`));
        }

        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json }));
    },

    deleteMany: (resource, params) => {
        // Payments, disbursements, repayments, and loans are immutable
        if (resource === 'payments' || resource === 'disbursements' || resource === 'repayments' || resource === 'loans') {
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
