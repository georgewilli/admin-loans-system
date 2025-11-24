import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    FunctionField,
    useNotify,
    useRefresh,
    TopToolbar,
    FilterButton,
    TextInput
} from 'react-admin';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button as MuiButton,
    TextField as MuiTextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box
} from '@mui/material';

// Rollback List View
export const RollbackList = () => {
    const filters = [
        <TextInput key="transactionId" label="Search Transaction ID" source="transactionId" alwaysOn />,
        <TextInput key="operation" label="Operation" source="operation" />,
    ];

    const ListActions = () => (
        <TopToolbar>
            <FilterButton />
            <RollbackDialog />
        </TopToolbar>
    );

    return (
        <List filters={filters} actions={<ListActions />} perPage={25}>
            <Datagrid bulkActionButtons={false}>
                <TextField source="transactionId" label="Transaction ID" />
                <FunctionField
                    label="Operation"
                    render={(record: any) => (
                        <Chip
                            label={record.originalOperation}
                            color={record.originalOperation === 'disbursement' ? 'primary' : 'secondary'}
                            size="small"
                        />
                    )}
                />
                <TextField source="rollbackReason" label="Reason" />
                <TextField source="rolledBackBy" label="Rolled Back By" />
                <DateField source="rollbackTimestamp" label="Rollback Date" showTime />
                <FunctionField
                    label="Error Details"
                    render={(record: any) => (
                        record.errorDetails ? (
                            <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {record.errorDetails.message || 'Error occurred'}
                            </Box>
                        ) : (
                            <span>-</span>
                        )
                    )}
                />
            </Datagrid>
        </List>
    );
};

// Rollback Dialog for Creating New Rollbacks
export const RollbackDialog = () => {
    const [open, setOpen] = React.useState(false);
    const [operationType, setOperationType] = React.useState<'disbursement' | 'payment'>('disbursement');
    const [recordId, setRecordId] = React.useState('');
    const notify = useNotify();
    const refresh = useRefresh();

    const handleRollback = async () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            const token = auth.access_token;

            const endpoint = `http://localhost:3000/rollback/${operationType}/${recordId}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Rollback failed');
            }

            const result = await response.json();
            notify(result.message || `${operationType} rolled back successfully`);
            setOpen(false);
            setRecordId('');
            setOperationType('disbursement');
            refresh();
        } catch (error: any) {
            notify(error.message || 'Error rolling back transaction', { type: 'error' });
        }
    };

    return (
        <>
            <MuiButton variant="contained" color="error" onClick={() => setOpen(true)} sx={{ ml: 1 }}>
                New Rollback
            </MuiButton>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Rollback Transaction</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal" sx={{ mt: 2 }}>
                        <InputLabel>Operation Type</InputLabel>
                        <Select
                            value={operationType}
                            label="Operation Type"
                            onChange={(e) => setOperationType(e.target.value as 'disbursement' | 'payment')}
                        >
                            <MenuItem value="disbursement">Disbursement</MenuItem>
                            <MenuItem value="payment">Payment</MenuItem>
                        </Select>
                    </FormControl>
                    <MuiTextField
                        fullWidth
                        label={operationType === 'disbursement' ? 'Disbursement ID' : 'Payment ID'}
                        value={recordId}
                        onChange={(e) => setRecordId(e.target.value)}
                        margin="normal"
                        helperText={`Enter the ${operationType} ID to rollback`}
                    />
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
                    <MuiButton
                        onClick={handleRollback}
                        variant="contained"
                        color="error"
                        disabled={!recordId}
                    >
                        Rollback {operationType}
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </>
    );
};
