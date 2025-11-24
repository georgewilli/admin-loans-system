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

// Payment List (Read-only - Payments are immutable)
export const PaymentList = () => (
    <List>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" label="Loan ID" />
            <TextField source="repaymentScheduleId" label="Schedule ID" />
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

                        <label>Payment Date:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ width: '100%', padding: 8, marginBottom: 16 }}
                        />

                        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                ℹ️ Payment amount will be automatically calculated based on the payment date.
                                The system will calculate all interest, late fees, and principal due up to this date.
                            </Typography>
                        </Box>

                        {breakdown && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                <Typography variant="h6">Payment Breakdown</Typography>
                                <Typography><strong>Total Amount Charged:</strong> ${breakdown.totalAmountCharged?.toFixed(2)}</Typography>
                                <Typography><strong>Schedules Covered:</strong> {breakdown.schedulesCovered}</Typography>
                                <Typography><strong>Total Principal Paid:</strong> ${breakdown.totalPrincipalPaid?.toFixed(2)}</Typography>
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    New Outstanding: ${breakdown.newOutstandingPrincipal?.toFixed(2)}
                                </Typography>

                                {breakdown.payments && breakdown.payments.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Payment Details:</strong></Typography>
                                        {breakdown.payments.map((payment: any, index: number) => (
                                            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                                <Typography variant="body2">Schedule #{index + 1}:</Typography>
                                                <Typography variant="body2">• Amount: ${payment.amount}</Typography>
                                                <Typography variant="body2">• Interest: ${payment.interestPaid}</Typography>
                                                <Typography variant="body2">• Late Fee: ${payment.lateFeePaid}</Typography>
                                                <Typography variant="body2">• Principal: ${payment.principalPaid}</Typography>
                                                <Typography variant="body2">• Days Late: {payment.daysLate}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </div>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={handleClose}>Close</MuiButton>
                    {!breakdown && (
                        <MuiButton
                            onClick={handlePayment}
                            variant="contained"
                            color="primary"
                            disabled={!selectedLoanId || !date}
                        >
                            Process Payment
                        </MuiButton>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
