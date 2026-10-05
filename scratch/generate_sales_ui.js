const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src/pages/Purchasing');
const destDir = path.join(__dirname, '../frontend/src/pages/Sales');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const fileMap = {
  'PurchaseDashboard.tsx': 'SalesDashboard.tsx',
  'PurchaseOrders.tsx': 'SalesOrders.tsx',
  'PurchaseOrderCreate.tsx': 'SalesOrderCreate.tsx',
  'PurchaseOrderDetail.tsx': 'SalesOrderDetail.tsx',
  'GoodsReceipts.tsx': 'DeliveryChallans.tsx',
  'PurchaseInvoices.tsx': 'SalesInvoices.tsx',
  'PurchaseReturns.tsx': 'SalesReturns.tsx'
};

function replaceContent(content) {
  let c = content;
  
  // Specific words
  c = c.replace(/PurchaseOrders/g, 'SalesOrders');
  c = c.replace(/PurchaseDashboard/g, 'SalesDashboard');
  c = c.replace(/PurchaseInvoices/g, 'SalesInvoices');
  c = c.replace(/PurchaseReturns/g, 'SalesReturns');
  c = c.replace(/PurchaseOrderDetail/g, 'SalesOrderDetail');
  c = c.replace(/PurchaseOrderCreate/g, 'SalesOrderCreate');
  c = c.replace(/GoodsReceipts/g, 'DeliveryChallans');

  c = c.replace(/Purchase Order/g, 'Sales Order');
  c = c.replace(/purchase order/g, 'sales order');
  c = c.replace(/Purchase Invoice/g, 'Sales Invoice');
  c = c.replace(/purchase invoice/g, 'sales invoice');
  c = c.replace(/Purchase Return/g, 'Sales Return');
  c = c.replace(/Goods Receipt/g, 'Delivery Challan');
  
  // Endpoints
  c = c.replace(/\/purchase\/orders/g, '/sales/orders');
  c = c.replace(/\/purchase\/dashboard/g, '/sales/dashboard');
  c = c.replace(/\/purchase\/receipts/g, '/sales/challans');
  c = c.replace(/\/purchase\/invoices/g, '/sales/invoices');
  c = c.replace(/\/purchase\/returns/g, '/sales/returns');

  // Paths
  c = c.replace(/\/purchasing\/orders/g, '/sales/orders');
  c = c.replace(/\/purchasing\/receipts/g, '/sales/challans');
  c = c.replace(/\/purchasing\/invoices/g, '/sales/invoices');
  c = c.replace(/\/purchasing\/returns/g, '/sales/returns');

  // Terms
  c = c.replace(/Supplier/g, 'Customer');
  c = c.replace(/supplier/g, 'customer');
  c = c.replace(/PO/g, 'SO');
  c = c.replace(/pos/g, 'sos'); // careful with this
  c = c.replace(/setPos/g, 'setSos');
  
  return c;
}

for (const [srcFile, destFile] of Object.entries(fileMap)) {
  const srcPath = path.join(srcDir, srcFile);
  const destPath = path.join(destDir, destFile);
  
  const content = fs.readFileSync(srcPath, 'utf8');
  const newContent = replaceContent(content);
  
  fs.writeFileSync(destPath, newContent);
  console.log(`Created ${destFile}`);
}
