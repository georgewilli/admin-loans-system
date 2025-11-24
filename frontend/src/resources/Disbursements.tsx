import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    NumberField,
    DateField,
    SimpleForm,
    NumberInput,
    DateInput,
    useNotify,
    useRefresh,
    useRecordContext,
    Button,
    useGetList,
} from 'react-admin';
import { fetchUtils } from 'react-admin';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from '@mui/material';

// Disbursement List (Read-only - Disbursements are immutable)
export const DisbursementList = () => (
    <List>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" label="Loan ID" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <DateField source="disbursementDate" />
            <TextField source="status" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);

// Disburse Loan Button in Dialog
export const DisburseDialog = () => {
    const [open, setOpen] = React.useState(false);
    const [selectedLoanId, setSelectedLoanId] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
    const notify = useNotify();
    const refresh = useRefresh();

    // Get approved loans
    const { data: loans } = useGetList('loans', {
        pagination: { page: 1, perPage: 100 },
    });

    const handleDisburse = async () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            const token = auth.access_token;

            await fetchUtils.fetchJson(`http://localhost:3000/disbursements/${selectedLoanId}/disburse`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    disbursementDate: date,
                }),
                headers: new Headers({
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                }),
            });

            notify('Loan disbursed successfully');
            setOpen(false);
            refresh();
        } catch (error: any) {
            notify(error.body?.message || 'Error disbursing loan', { type: 'error' });
        }
    };

    return (
        <>
            <MuiButton variant="contained" color="primary" onClick={() => setOpen(true)}>
                Disburse New Loan
            </MuiButton>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Disburse Loan</DialogTitle>
                <DialogContent>
                    <div style={{ marginTop: 16 }}>
                        <label>Select Loan:</label>
                        <select
                            value={selectedLoanId}
                            onChange={(e) => {
                                setSelectedLoanId(e.target.value);
                                const loan = loans?.find((l: any) => l.id === e.target.value);
                                if (loan) setAmount(loan.amount);
                            }}
                            style={{ width: '100%', padding: 8, marginBottom: 16 }}
                        >
                            <option value="">Select a loan...</option>
                            {loans?.filter((l: any) => l.status === 'APPROVED').map((loan: any) => (
                                <option key={loan.id} value={loan.id}>
                                    {loan.id} - ${loan.amount} ({loan.status})
                                </option>
                            ))}
                        </select>

                        <label>Amount:</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ width: '100%', padding: 8, marginBottom: 16 }}
                        />

                        <label>Disbursement Date:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
                    <MuiButton onClick={handleDisburse} variant="contained" color="primary">
                        Disburse
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </>
    );
};
