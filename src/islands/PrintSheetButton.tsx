import { track } from '../lib/analytics';

/**
 * Prints just the worksheet on the page. It marks the page for the print stylesheet (which hides
 * everything except `.print-sheet`), opens the print dialog, and clears the mark afterwards. The
 * print dialog's "Save as PDF" gives a PDF.
 */
export default function PrintSheetButton({ template }: { template: string }) {
  const print = () => {
    const root = document.documentElement;
    root.classList.add('print-sheet-only');
    const clear = () => {
      root.classList.remove('print-sheet-only');
      window.removeEventListener('afterprint', clear);
    };
    window.addEventListener('afterprint', clear);
    track('template_download', { template, format: 'print' });
    window.print();
  };
  return (
    <button type="button" class="btn no-print" onClick={print}>
      Print the plan, or save it as a PDF
    </button>
  );
}
