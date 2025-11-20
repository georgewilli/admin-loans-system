import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    FunctionField,
} from 'react-admin';

// Audit Log List
export const AuditLogList = () => (
    <List>
        <Datagrid>
            <TextField source="id" />
            <TextField source="transactionId" label="Transaction ID" />
            <TextField source="operation" />
            <TextField source="userId" label="User ID" />
            <FunctionField
                label="Metadata"
                render={(record: any) => JSON.stringify(record.metadata, null, 2)}
            />
            <DateField source="createdAt" showTime />
        </Datagrid>
    </List>
);
