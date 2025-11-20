import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    NumberField,
    DateField,
    useNotify,
    useRefresh,
    useGetList,
} from 'react-admin';
import { fetchUtils } from 'react-admin';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, Typography, Box } from '@mui/material';

// Payment List
export const PaymentList = () => (
    <List>
        <Datagrid>
            <TextField source="id" />
            <TextField source="loanId" label="Loan ID" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="principalPaid" label="Principal" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestPaid" label="Interest" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="lateFeePaid" label="Late Fee" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="daysLate" label="Days Late" />
            <DateField source="paymentDate" />
            <TextField source="status" />
        </Datagrid>
    </List>
);

// Payment Processing Dialog
export const PaymentDialog = () => {
    const [open, setOpen] = React.useState(false);
    const [selectedLoanId, setSelectedLoanId] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [breakdown, setBreakdown] = React.useState<any>(null);
    const notify = useNotify();
    const refresh = useRefresh();

    // Get active loans
    const { data: loans } = useGetList('loans', {
        pagination: { page: 1, perPage: 100 },
    });

    const handlePayment = async () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            const token = auth.access_token;

            const response = await fetchUtils.fetchJson('http://localhost:3000/payments', {
                method: 'POST',
                body: JSON.stringify({
                    loanId: selectedLoanId,
                    amount: parseFloat(amount),
                    paymentDate: date,
                }),
                headers: new Headers({
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                }),
            });

            setBreakdown(response.json);
            notify('Payment processed successfully');
            refresh();
        } catch (error: any) {
            notify(error.body?.message || 'Error processing payment', { type: 'error' });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setBreakdown(null);
        setSelectedLoanId('');
        setAmount('');
    };

    return (
        <>
            <MuiButton variant="contained" color="primary" onClick={() => setOpen(true)}>
                Process New Payment
            </MuiButton>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Process Payment</DialogTitle>
                <DialogContent>
                    <div style={{ marginTop: 16 }}>
                        <label>Select Loan:</label>
                        <select
                            value={selectedLoanId}
                            onChange={(e) => setSelectedLoanId(e.target.value)}
                            style={{ width: '100%', padding: 8, marginBottom: 16 }}
                        >
                            <option value="">Select a loan...</option>
                            {loans?.filter((l: any) => l.status === 'ACTIVE').map((loan: any) => (
                                <option key={loan.id} value={loan.id}>
                                    {loan.id} - Outstanding: ${loan.outstandingPrincipal}
                                </option>
                            ))}
                        </select>

                        <label>Payment Amount:</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ width: '100%', padding: 8, marginBottom: 16 }}
                            step="0.01"
                        />

                        <label>Payment Date:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ width: '100%', padding: 8, marginBottom: 16 }}
                        />

                        {breakdown && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                <Typography variant="h6">Payment Breakdown</Typography>
                                <Typography>Interest Paid: ${breakdown.accruedInterest}</Typography>
                                <Typography>Late Fee: ${breakdown.lateFee}</Typography>
                                <Typography>Principal Paid: ${breakdown.payment.principalPaid}</Typography>
                                <Typography>Days Since Last Payment: {breakdown.daysSinceLastPayment}</Typography>
                                <Typography>Days Late: {breakdown.daysLate}</Typography>
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    New Outstanding: ${breakdown.newOutstandingPrincipal}
                                </Typography>
                            </Box>
                        )}
                    </div>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={handleClose}>Close</MuiButton>
                    {!breakdown && (
                        <MuiButton onClick={handlePayment} variant="contained" color="primary">
                            Process Payment
                        </MuiButton>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
