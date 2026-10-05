import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/store/authStore';

const RetailThermalReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantContext } = useAuthStore();
  const bill = location.state?.bill;

  useEffect(() => {
    if (bill) {
      setTimeout(() => {
        window.print();
        // Optional: navigate back after print dialog closes, though browsers block this sometimes
        // navigate(-1);
      }, 500);
    }
  }, [bill, navigate]);

  if (!bill) {
    return <div>No bill data provided for printing.</div>;
  }

  return (
    <div className="r-thermal-receipt" style={{ width: '80mm', padding: '5mm', margin: '0 auto', fontSize: '12px', fontFamily: 'monospace', color: '#000', background: '#fff' }}>
      {/* Print-specific CSS */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .r-thermal-receipt, .r-thermal-receipt * { visibility: visible; }
            .r-thermal-receipt { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 0; }
          }
        `}
      </style>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{tenantContext?.company_name || 'EVOLIX RETAIL'}</h2>
        <div style={{ fontSize: '10px' }}>TAX INVOICE</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px', paddingBottom: '5px' }}>
        <div>Bill No: {bill.document_number}</div>
        <div>Date: {new Date(bill.document_date).toLocaleString()}</div>
        <div>Customer: {bill.party?.name || 'Walk-in'}</div>
      </div>

      <table style={{ width: '100%', marginBottom: '10px', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
            <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Qty</th>
            <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {bill.sales_invoice_line?.map((line: any) => (
            <tr key={line.id}>
              <td style={{ paddingTop: '5px' }}>{line.item?.name}</td>
              <td style={{ textAlign: 'right', paddingTop: '5px' }}>{Number(line.quantity)}</td>
              <td style={{ textAlign: 'right', paddingTop: '5px' }}>{Number(line.line_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>TOTAL</span>
          <span>₹{Number(bill.grand_total).toFixed(2)}</span>
        </div>
        {Number(bill.tax_amount) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>Includes GST:</span>
            <span>₹{Number(bill.tax_amount).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '20px' }}>
        Thank you for your visit!<br />
        Powered by EVOLIX
      </div>
    </div>
  );
};

export default RetailThermalReceipt;
