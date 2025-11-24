import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    NumberField,
    DateField,
    Show,
    SimpleShowLayout,
    FunctionField,
} from 'react-admin';

// Account List
export const AccountList = () => (
    <List>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <FunctionField
                label="Email"
                render={(record: any) =>
                    record.user?.email || <span style={{ fontStyle: 'italic', color: '#666' }}>Platform Account</span>
                }
            />
            <TextField source="type" />
            <NumberField source="balance" options={{ style: 'currency', currency: 'USD' }} />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);

// Account Show
export const AccountShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <FunctionField
                label="Email"
                render={(record: any) =>
                    record.user?.email || <span style={{ fontStyle: 'italic', color: '#666' }}>Platform Account</span>
                }
            />
            <TextField source="type" />
            <NumberField source="balance" options={{ style: 'currency', currency: 'USD' }} label="Current Balance" />
            <DateField source="createdAt" showTime />
            <DateField source="updatedAt" showTime />
        </SimpleShowLayout>
    </Show>
);
