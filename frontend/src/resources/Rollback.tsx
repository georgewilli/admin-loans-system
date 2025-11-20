import React from 'react';
import { useNotify, useRefresh } from 'react-admin';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, TextField } from '@mui/material';

// Rollback Interface
export const RollbackDialog = () => {
    const [open, setOpen] = React.useState(false);
    const [transactionId, setTransactionId] = React.useState('');
    const [reason, setReason] = React.useState('');
    const notify = useNotify();
    const refresh = useRefresh();

    const handleRollback = async () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            const token = auth.access_token;

            const response = await fetch(`http://localhost:3000/rollback/${transactionId}`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Rollback failed');
            }

            notify('Transaction rolled back successfully');
            setOpen(false);
            setTransactionId('');
            setReason('');
            refresh();
        } catch (error: any) {
            notify(error.message || 'Error rolling back transaction', { type: 'error' });
        }
    };

    return (
        <>
            <MuiButton variant="contained" color="error" onClick={() => setOpen(true)}>
                Rollback Transaction
            </MuiButton>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Rollback Transaction</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Reason for Rollback"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        margin="normal"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
                    <MuiButton
                        onClick={handleRollback}
                        variant="contained"
                        color="error"
                        disabled={!transactionId || !reason}
                    >
                        Rollback
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </>
    );
};
