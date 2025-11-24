import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    NumberField,
    DateField,
    FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

// Repayment Schedule List (Read-only - Repayment schedules are immutable)
export const RepaymentScheduleList = () => (
    <List>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" label="Loan ID" />
            <NumberField source="installmentNumber" label="Installment #" />
            <DateField source="dueDate" />
            <NumberField source="principalAmount" label="Principal" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestAmount" label="Interest" options={{ style: 'currency', currency: 'USD' }} />
            <FunctionField
                label="Status"
                render={(record: any) => (
                    <Chip
                        label={record.status}
                        color={
                            record.status === 'PAID' ? 'success' :
                                record.status === 'PARTIALLY_PAID' ? 'warning' :
                                    'default'
                        }
                        size="small"
                    />
                )}
            />
            <DateField source="paidDate" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);
