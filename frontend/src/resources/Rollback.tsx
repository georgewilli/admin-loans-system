import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    FunctionField,
    TopToolbar,
    FilterButton,
    useNotify,
    useRefresh,
    useDataProvider
} from 'react-admin';
import {
    Chip,
    Box,
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
} from '@mui/material';

// Rollback Dialog for Creating New Rollbacks
export const RollbackDialog = () => {
    const [open, setOpen] = React.useState(false);
    const [operationType, setOperationType] = React.useState<'disbursement' | 'payment'>('disbursement');
    const [recordId, setRecordId] = React.useState('');
    const [reason, setReason] = React.useState('');
    const [options, setOptions] = React.useState<any[]>([]);
    const notify = useNotify();
    const refresh = useRefresh();
    const dataProvider = useDataProvider();

    React.useEffect(() => {
        if (open) {
            const resource = operationType === 'disbursement' ? 'disbursements' : 'payments';
            dataProvider.getList(resource, {
                pagination: { page: 1, perPage: 100 },
                sort: { field: 'createdAt', order: 'DESC' },
                filter: {}
            })
                .then(({ data }) => {
                    // Filter out records that are already rolled back
                    const filteredData = data.filter((item: any) => item.status !== 'ROLLED_BACK');
                    setOptions(filteredData);
                })
                .catch(error => {
                    console.error(error);
                    notify('Error fetching options', { type: 'error' });
                });
        }
    }, [open, operationType, dataProvider, notify]);

    const handleRollback = async () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            const token = auth.access_token;

            const endpoint = `${process.env.REACT_APP_API_URL}/rollback/${operationType}/${recordId}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Rollback failed');
            }

            const result = await response.json();
            notify(result.message || `${operationType} rolled back successfully`);
            setOpen(false);
            setRecordId('');
            setReason('');
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
                            onChange={(e) => {
                                setOperationType(e.target.value as 'disbursement' | 'payment');
                                setRecordId('');
                            }}
                        >
                            <MenuItem value="disbursement">Disbursement</MenuItem>
                            <MenuItem value="payment">Payment</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <InputLabel>{operationType === 'disbursement' ? 'Select Disbursement' : 'Select Payment'}</InputLabel>
                        <Select
                            value={recordId}
                            label={operationType === 'disbursement' ? 'Select Disbursement' : 'Select Payment'}
                            onChange={(e) => setRecordId(e.target.value)}
                        >
                            {options.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {operationType === 'disbursement'
                                        ? `ID: ${option.id} - Amount: ${option.amount} - Date: ${new Date(option.disbursedAt || option.createdAt).toLocaleDateString()}`
                                        : `ID: ${option.id} - Amount: ${option.amount} - Date: ${new Date(option.paymentDate || option.createdAt).toLocaleDateString()}`
                                    }
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <MuiTextField
                        fullWidth
                        label="Rollback Reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        margin="normal"
                        multiline
                        rows={2}
                        required
                        helperText="Please provide a reason for this rollback"
                    />
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
                    <MuiButton
                        onClick={handleRollback}
                        variant="contained"
                        color="error"
                        disabled={!recordId || !reason}
                    >
                        Rollback {operationType}
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Rollback List View
export const RollbackList = () => {

    const ListActions = () => (
        <TopToolbar>
            <RollbackDialog />
        </TopToolbar>
    );

    return (
        <List actions={<ListActions />} perPage={25} sort={{ field: 'createdAt', order: 'DESC' }}>
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
                <FunctionField
                    label="Reason"
                    render={(record: any) => record.rollbackReason || '-'}
                />
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
