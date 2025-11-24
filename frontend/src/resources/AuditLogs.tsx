import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    FunctionField,
    TextInput,
} from 'react-admin';
import { Box } from '@mui/material';

// Audit Log List
export const AuditLogList = () => {
    return (
        <List sort={{ field: 'createdAt', order: 'DESC' }}>
            <Datagrid bulkActionButtons={false}>
                <TextField source="id" />
                <TextField source="transactionId" label="Transaction ID" />
                <TextField source="operation" />
                <TextField source="userId" label="User ID" />
                <FunctionField
                    label="Metadata"
                    render={(record: any) => (
                        <Box sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(record.metadata, null, 2)}>
                            {JSON.stringify(record.metadata)}
                        </Box>
                    )}
                />
                <DateField source="createdAt" showTime />
            </Datagrid>
        </List>
    );
};
