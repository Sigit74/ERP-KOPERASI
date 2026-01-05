import React, { useEffect } from 'react';
/* Import HashRouter and routing components from react-router-dom */
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAppConfig, fetchAppConfigFromDB } from './lib/appConfig';

/* Import all page components */
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { FarmersList } from './pages/farmers/FarmersList';
import { FarmerDetail } from './pages/farmers/FarmerDetail';
import { FarmerForm } from './pages/farmers/FarmerForm';
import { PurchasesList } from './pages/purchases/PurchasesList';
import { NewPurchase } from './pages/purchases/NewPurchase';
import { PurchaseDetail } from './pages/purchases/PurchaseDetail';
import { SupplierPurchaseForm } from './pages/purchases/SupplierPurchaseForm';
import { ProductsList } from './pages/products/ProductsList';
import { ProductForm } from './pages/products/ProductForm';
import { SheltersList } from './pages/shelters/SheltersList';
import { ShelterForm } from './pages/shelters/ShelterForm';
import { GroupsList } from './pages/groups/GroupsList';
import { GroupForm } from './pages/groups/GroupForm';
import { InventoryList } from './pages/inventory/InventoryList';
import { StockAdjustment } from './pages/inventory/StockAdjustment';
import { FixedAssetsList } from './pages/inventory/FixedAssetsList';
import { CoaList } from './pages/accounting/CoaList';
import { JournalsList } from './pages/accounting/JournalsList';
import { NewJournal } from './pages/accounting/NewJournal';
import { JournalDetail } from './pages/accounting/JournalDetail';
import { EditJournal } from './pages/accounting/EditJournal';
import { GeneralLedger } from './pages/accounting/GeneralLedger';
import { IncomeStatement } from './pages/accounting/IncomeStatement';
import { BalanceSheet } from './pages/accounting/BalanceSheet';
import { CashFlow } from './pages/accounting/CashFlow';
import { SalesList } from './pages/sales/SalesList';
import { NewSale } from './pages/sales/NewSale';
import { BatchList } from './pages/production/BatchList';
import { CreateBatch } from './pages/production/CreateBatch';
import { BatchDetail } from './pages/production/BatchDetail';
import { LotList } from './pages/production/LotList';
import { CreateLot } from './pages/production/CreateLot';
import { LotDetail } from './pages/production/LotDetail';
import { PublicTraceability } from './pages/public/PublicTraceability';
import { CommoditySalesList } from './pages/sales/CommoditySalesList';
import { NewCommoditySale } from './pages/sales/NewCommoditySale';
import { CommoditySaleDetail } from './pages/sales/CommoditySaleDetail';
import { FarmerMap } from './pages/map/FarmerMap';
import { UserManagement } from './pages/staff/UserManagement';
import { StaffList } from './pages/staff/StaffList';
import { StaffForm } from './pages/staff/StaffForm';
import { SavingsList } from './pages/finance/SavingsList';
import { LoansList } from './pages/finance/LoansList';
import { OperationalList } from './pages/finance/OperationalList';
import { ExpenseForm } from './pages/finance/ExpenseForm';
import { VendorList } from './pages/finance/VendorList';
import { Overview } from './pages/Overview';
import { DatabaseDocs } from './pages/DatabaseDocs';
import { RolesDocs } from './pages/RolesDocs';
import { ApiDocs } from './pages/ApiDocs';
import { DeploymentDocs } from './pages/DeploymentDocs';
import { NextJsReadme } from './pages/NextJsReadme';
import { Settings } from './pages/Settings';
import { RegionalData } from './pages/master/RegionalData';
import { MobileIntegrationDocs } from './pages/docs/MobileIntegrationDocs';

const App = () => {
  useEffect(() => {
    fetchAppConfigFromDB();
  }, []);

  return (
    /* Use HashRouter for compatibility with static hosting environments */
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Farmers & Land Management */}
        <Route path="/farmers" element={<FarmersList />} />
        <Route path="/farmers/new" element={<FarmerForm />} />
        <Route path="/farmers/:id" element={<FarmerDetail />} />
        <Route path="/farmers/edit/:id" element={<FarmerForm />} />
        <Route path="/map/farmers" element={<FarmerMap />} />

        {/* Master Data Routes */}
        <Route path="/groups" element={<GroupsList />} />
        <Route path="/groups/new" element={<GroupForm />} />
        <Route path="/groups/edit/:id" element={<GroupForm />} />
        <Route path="/products" element={<ProductsList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/shelters" element={<SheltersList />} />
        <Route path="/shelters/new" element={<ShelterForm />} />
        <Route path="/master/regional" element={<RegionalData />} />

        {/* Procurement & Stock Operations */}
        <Route path="/purchases" element={<PurchasesList />} />
        <Route path="/purchases/new" element={<NewPurchase />} />
        <Route path="/purchases/supplier" element={<SupplierPurchaseForm />} />
        <Route path="/purchases/supplier/edit/:id" element={<SupplierPurchaseForm />} />
        <Route path="/purchases/:id" element={<PurchaseDetail />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/adjustment" element={<StockAdjustment />} />
        <Route path="/inventory/fixed-assets" element={<FixedAssetsList />} />

        {/* Retail Module */}
        <Route path="/sales/retail" element={<SalesList />} />
        <Route path="/sales/new" element={<NewSale />} />

        {/* Production & B2B Supply Chain */}
        <Route path="/production" element={<BatchList />} />
        <Route path="/production/new" element={<CreateBatch />} />
        <Route path="/production/:id" element={<BatchDetail />} />
        <Route path="/production/lots" element={<LotList />} />
        <Route path="/production/lots/:id" element={<LotDetail />} />
        <Route path="/sales/lot/new" element={<CreateLot />} />
        <Route path="/sales/commodity" element={<CommoditySalesList />} />
        <Route path="/sales/commodity/new" element={<NewCommoditySale />} />
        <Route path="/sales/commodity/:id" element={<CommoditySaleDetail />} />

        {/* Public Access Module */}
        <Route path="/trace/:lotCode" element={<PublicTraceability />} />

        {/* Finance & Accounting Module */}
        <Route path="/finance/savings" element={<SavingsList />} />
        <Route path="/finance/loans" element={<LoansList />} />
        <Route path="/finance/operational" element={<OperationalList />} />
        <Route path="/finance/expenses/new" element={<ExpenseForm />} />
        <Route path="/finance/expenses/edit/:id" element={<ExpenseForm />} />
        <Route path="/finance/vendors" element={<VendorList />} />
        <Route path="/accounting/coa" element={<CoaList />} />
        <Route path="/accounting/journals" element={<JournalsList />} />
        <Route path="/accounting/journals/new" element={<NewJournal />} />
        <Route path="/accounting/journals/:id" element={<JournalDetail />} />
        <Route path="/accounting/journals/edit/:id" element={<EditJournal />} />
        <Route path="/accounting/ledger" element={<GeneralLedger />} />
        <Route path="/accounting/income-statement" element={<IncomeStatement />} />
        <Route path="/accounting/balance-sheet" element={<BalanceSheet />} />
        <Route path="/accounting/cash-flow" element={<CashFlow />} />

        {/* HR & Access Control */}
        <Route path="/staff" element={<StaffList />} />
        <Route path="/staff/new" element={<StaffForm />} />
        <Route path="/staff/users" element={<UserManagement />} />

        {/* System & Documentation Routes */}
        <Route path="/docs/overview" element={<Overview />} />
        <Route path="/docs/database" element={<DatabaseDocs />} />
        <Route path="/docs/roles" element={<RolesDocs />} />
        <Route path="/docs/api" element={<ApiDocs />} />
        <Route path="/docs/deploy" element={<DeploymentDocs />} />
        <Route path="/docs/nextjs" element={<NextJsReadme />} />
        <Route path="/docs/mobile-logic" element={<MobileIntegrationDocs />} />
        <Route path="/settings" element={<Settings />} />

        {/* Default fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
};

/* Fixing error: Module '"file:///App"' has no default export */
export default App;
