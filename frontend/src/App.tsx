import React from 'react';
import { Admin, Resource, Layout, AppBar } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { LoanList, LoanCreate, LoanShow } from './resources/Loans';
import { DisbursementList, DisburseDialog } from './resources/Disbursements';
import { PaymentList, PaymentDialog } from './resources/Payments';
import { RollbackDialog, RollbackList } from './resources/Rollback';
import { AuditLogList } from './resources/AuditLogs';
import { RepaymentScheduleList } from './resources/Repayments';
import { AccountList, AccountShow } from './resources/Accounts';
import { Box, Typography } from '@mui/material';

// Custom App Bar with Action Buttons
const CustomAppBar = () => (
  <AppBar>
    <Typography variant="h6" sx={{ flex: 1 }}>
      Loan Management System
    </Typography>
  </AppBar>
);

// Custom Layout
const CustomLayout = (props: any) => <Layout {...props} appBar={CustomAppBar} />;

// Dashboard with Action Buttons
const Dashboard = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Loan Management Dashboard
    </Typography>
    <Typography variant="body1" paragraph>
      Welcome to the Loan Management System. Use the menu to navigate between different sections.
    </Typography>

    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
      <DisburseDialog />
      <PaymentDialog />
      <RollbackDialog />
    </Box>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>Quick Actions:</Typography>
      <ul>
        <li>Create a new loan and approve it</li>
        <li>Disburse approved loans</li>
        <li>Process payments on active loans</li>
        <li>View audit logs for compliance</li>
        <li>Rollback transactions if needed</li>
      </ul>
    </Box>
  </Box>
);

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
      layout={CustomLayout}
    >
      <Resource
        name="loans"
        list={LoanList}
        create={LoanCreate}
        show={LoanShow}
      />
      <Resource
        name="disbursements"
        list={DisbursementList}
      />
      <Resource
        name="payments"
        list={PaymentList}
      />
      <Resource
        name="repayments"
        list={RepaymentScheduleList}
        options={{ label: 'Repayment Schedules' }}
      />
      <Resource
        name="audit-logs"
        list={AuditLogList}
        options={{ label: 'Audit Logs' }}
      />
      <Resource
        name="rollback"
        list={RollbackList}
        options={{ label: 'Rollbacks' }}
      />
      <Resource
        name="accounts"
        list={AccountList}
        show={AccountShow}
        options={{ label: 'Accounts' }}
      />
    </Admin>
  );
}

export default App;

