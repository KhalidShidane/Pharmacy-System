import { CheckCircle2, Printer } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Receipt from '../../components/receipts/Receipt';
import { useSettings } from '../../context/SettingsContext';

export default function SaleSuccessModal({ open, sale, onClose, onNewSale }) {
  const settings = useSettings();
  if (!sale) return null;

  return (
    <Modal
      open={open}
      onClose={onNewSale}
      size="sm"
      title={
        <span className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-4" /> Sale completed
        </span>
      }
      description={sale.invoiceNumber}
      footer={
        <>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <Button onClick={onNewSale}>New Sale</Button>
        </>
      }
    >
      <div className="rounded-lg border border-border bg-surface-alt p-3">
        <Receipt sale={sale} settings={settings} />
      </div>
    </Modal>
  );
}
