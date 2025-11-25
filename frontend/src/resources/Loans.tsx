import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    NumberField,
    DateField,
    Create,
    SimpleForm,
    TextInput,
    NumberInput,
    Edit,
    Show,
    SimpleShowLayout,
    useRecordContext,
    Button,
    useNotify,
    useRefresh,
    ReferenceInput,
    SelectInput,
    FunctionField,
    Link,
    useRedirect,
} from 'react-admin';
import { fetchUtils } from 'react-admin';

// View Repayments Button
const ViewRepaymentsButton = () => {
    const record = useRecordContext();
    const redirect = useRedirect();

    if (!record || record.status !== 'ACTIVE') return null;

    return (
        <Button
            label="View Repayments"
            onClick={(e) => {
                e.stopPropagation();
                redirect('list', 'repayments', undefined, undefined, { loanId: record.id });
            }}
        />
    );
};

// Loan List
export const LoanList = () => (
    <List>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <FunctionField
                label="Account"
                render={(record: any) => {
                    const accountId = record.account?.id || record.accountId;
                    const displayName = record.account?.user?.name ||
                        record.account?.user?.email ||
                        accountId;

                    return (
                        <Link
                            to={`/accounts/${accountId}/show`}
                            onClick={(e: any) => e.stopPropagation()}
                        >
                            {displayName}
                        </Link>
                    );
                }}
            />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestRate" label="Interest Rate %" />
            <NumberField source="tenor" label="Tenor (months)" />
            <TextField source="status" />
            <NumberField source="outstandingPrincipal" label="Outstanding" options={{ style: 'currency', currency: 'USD' }} />
            <DateField source="createdAt" />
            <ViewRepaymentsButton />
        </Datagrid>
    </List>
);

// Loan Create
export const LoanCreate = () => (
    <Create>
        <SimpleForm>
            <ReferenceInput
                source="accountId"
                reference="accounts"
                label="Account"
                filter={{ type: 'USER' }}
            >
                <SelectInput optionText={(record) => `${record.user?.name || record.id} (Balance: $${record.balance})`} />
            </ReferenceInput>
            <NumberInput source="amount" required />
            <NumberInput source="interestRate" label="Interest Rate (%)" required />
            <NumberInput source="tenor" label="Tenor (months)" required />
        </SimpleForm>
    </Create>
);

// Approve Loan Button
const ApproveLoanButton = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();

    const handleApprove = async () => {
        if (!record) return;

        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            const token = auth.access_token;

            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            await fetchUtils.fetchJson(`${apiUrl}/loans/${record.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'APPROVED' }),
                headers: new Headers({
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                }),
            });

            notify('Loan approved successfully');
            refresh();
        } catch (error) {
            notify('Error approving loan', { type: 'error' });
        }
    };

    if (!record || record.status !== 'PENDING') return null;

    return (
        <Button label="Approve Loan" onClick={handleApprove} />
    );
};

// Loan Show
export const LoanShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <FunctionField
                label="Account"
                render={(record: any) => {
                    if (record.account?.user) {
                        return `${record.account.user.name} (${record.account.user.email})`;
                    }
                    return record.accountId;
                }}
            />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestRate" label="Interest Rate %" />
            <NumberField source="tenor" label="Tenor (months)" />
            <TextField source="status" />
            <NumberField source="outstandingPrincipal" label="Outstanding Principal" options={{ style: 'currency', currency: 'USD' }} />
            <DateField source="createdAt" showTime />
            <DateField source="updatedAt" showTime />
            <ApproveLoanButton />
        </SimpleShowLayout>
    </Show>
);
