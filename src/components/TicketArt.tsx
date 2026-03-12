import { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface TicketArtProps {
  codigo: string;
  data_validade?: string | null;
  showDownload?: boolean;
}

const VOUCHER_IMAGE_PATH = '/MOLDE_VOUCHER_CINEX_1.png';

export function TicketArt({ codigo, data_validade, showDownload = true }: TicketArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const validadeFormatted = data_validade
    ? new Date(data_validade + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = VOUCHER_IMAGE_PATH;
  }, []);

  const downloadPDF = async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      const pdfWidth = 90;
      const pdfHeight = (imgHeight / imgWidth) * pdfWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight);

      pdf.addFont('Helvetica', 'Helvetica', 'bold');
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);

      const codeY = pdfHeight * 0.54;
      pdf.setFontSize(12);
      pdf.text(codigo, pdfWidth / 2, codeY, { align: 'center' });

      const dateY = pdfHeight * 0.73;
      pdf.setFontSize(10);
      pdf.text(validadeFormatted, pdfWidth / 2, dateY, { align: 'center' });

      pdf.save(`cortesia-${codigo}.pdf`);
    };

    img.src = VOUCHER_IMAGE_PATH;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className="relative w-full mx-auto overflow-hidden"
        style={{ aspectRatio: '828/1568' }}
      >
        <img
          src={VOUCHER_IMAGE_PATH}
          alt="Voucher Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {imageLoaded && (
          <>
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{
                top: '51.5%',
                height: '5%'
              }}
            >
              <span
                className="font-bold tracking-wide"
                style={{
                  fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(12px, 4vw, 24px)',
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {codigo}
              </span>
            </div>

            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{
                top: '71.2%',
                height: '4%'
              }}
            >
              <span
                className="font-bold tracking-wide"
                style={{
                  fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(10px, 3.5vw, 20px)',
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {validadeFormatted}
              </span>
            </div>
          </>
        )}
      </div>

      {showDownload && (
        <button
          onClick={downloadPDF}
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-purple-700 p-2 rounded-lg shadow-lg transition-all hover:scale-105"
          title="Baixar PDF"
        >
          <Download size={16} />
        </button>
      )}
    </div>
  );
}

export async function generateBatchPDF(
  codigos: string[],
  data_validade: string | null,
  solicitante: string
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;

      const ticketWidth = 90;
      const ticketHeight = (imgHeight / imgWidth) * ticketWidth;
      const margin = 5;
      const pageWidth = 210;
      const pageHeight = 297;

      const cols = 2;
      const rows = Math.floor((pageHeight - 2 * margin) / (ticketHeight + margin));
      const ticketsPerPage = cols * rows;

      const validadeFormatted = data_validade
        ? new Date(data_validade + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '';

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const drawTicket = (x: number, y: number, codigo: string) => {
        pdf.addImage(img, 'PNG', x, y, ticketWidth, ticketHeight);

        pdf.setFont('Helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);

        const codeY = y + ticketHeight * 0.54;
        pdf.setFontSize(10);
        pdf.text(codigo, x + ticketWidth / 2, codeY, { align: 'center' });

        const dateY = y + ticketHeight * 0.73;
        pdf.setFontSize(8);
        pdf.text(validadeFormatted, x + ticketWidth / 2, dateY, { align: 'center' });
      };

      codigos.forEach((codigo, index) => {
        if (index > 0 && index % ticketsPerPage === 0) {
          pdf.addPage();
        }

        const pageIndex = index % ticketsPerPage;
        const col = pageIndex % cols;
        const row = Math.floor(pageIndex / cols);

        const totalWidth = cols * ticketWidth + (cols - 1) * margin;
        const startX = (pageWidth - totalWidth) / 2;

        const x = startX + col * (ticketWidth + margin);
        const y = margin + row * (ticketHeight + margin);

        drawTicket(x, y, codigo);
      });

      pdf.save(`cortesias-${solicitante.replace(/\s+/g, '-').toLowerCase()}-${codigos.length}un.pdf`);
      resolve();
    };

    img.src = VOUCHER_IMAGE_PATH;
  });
}
