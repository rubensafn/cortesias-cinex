import { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface TicketArtProps {
  codigo: string;
  data_validade?: string | null;
  showDownload?: boolean;
}

// ── Cortesias ──────────────────────────────────────────────────────────────
const CORTESIAS_IMAGE      = '/MOLDE_VOUCHER_CINEX_1.png';
const CORTESIAS_CODE_Y     = 0.560;   // % do topo onde cai o código
const CORTESIAS_DATE_Y     = 0.752;   // % do topo onde cai a validade

// ── Empresa ────────────────────────────────────────────────────────────────
const EMPRESA_FRENTE         = '/EMPRESA_INGRESSO_FRENTE_SEMTEXTO.png';
const EMPRESA_VERSO          = '/EMPRESA_INGRESSO_VERSO.png';
const EMPRESA_CODE_Y         = 0.827;   // % do topo — contorno vermelho/rosa
const EMPRESA_DATE_LABEL_Y   = 0.694;   // % do topo — "VALIDADE:" no shape rosa
const EMPRESA_DATE_VALUE_Y   = 0.717;   // % do topo — valor da data

function formatDate(data_validade?: string | null) {
  if (!data_validade) return '';
  return new Date(data_validade + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── Componente de preview ──────────────────────────────────────────────────
export function TicketArt({ codigo, data_validade, showDownload = true }: TicketArtProps) {
  const { appMode } = useApp();
  const isEmpresa = appMode === 'empresa';
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imagePath     = isEmpresa ? EMPRESA_FRENTE    : CORTESIAS_IMAGE;
  const codeTopPct    = isEmpresa ? EMPRESA_CODE_Y    : CORTESIAS_CODE_Y;
  const dateTopPct    = isEmpresa ? EMPRESA_DATE_LABEL_Y : CORTESIAS_DATE_Y;
  const validadeStr   = formatDate(data_validade);

  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.onload  = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = imagePath;
  }, [imagePath]);

  // ── Download PDF ─────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    const frente = await loadImage(imagePath);
    const pdfW   = 90;
    const pdfH   = (frente.height / frente.width) * pdfW;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfW, pdfH] });
    pdf.addImage(frente, 'PNG', 0, 0, pdfW, pdfH);

    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);

    // código
    pdf.setFontSize(isEmpresa ? 14 : 20);
    pdf.text(codigo, pdfW / 2, pdfH * codeTopPct, { align: 'center' });

    // data
    if (isEmpresa) {
      pdf.setFontSize(8);
      pdf.text('VALIDADE:', pdfW / 2, pdfH * EMPRESA_DATE_LABEL_Y, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(validadeStr, pdfW / 2, pdfH * EMPRESA_DATE_VALUE_Y, { align: 'center' });
    } else {
      pdf.setFontSize(13);
      pdf.text(validadeStr, pdfW / 2, pdfH * dateTopPct, { align: 'center' });
    }

    // verso (apenas Empresa)
    if (isEmpresa) {
      const verso = await loadImage(EMPRESA_VERSO);
      const versoH = (verso.height / verso.width) * pdfW;
      pdf.addPage([pdfW, versoH], 'portrait');
      pdf.addImage(verso, 'PNG', 0, 0, pdfW, versoH);
    }

    const prefix = isEmpresa ? 'ingresso' : 'cortesia';
    pdf.save(`${prefix}-${codigo}.pdf`);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className="relative w-full mx-auto overflow-hidden"
        style={{ aspectRatio: '591/1063' }}
      >
        <img
          src={imagePath}
          alt={isEmpresa ? 'Ingresso Empresa' : 'Voucher Cortesias'}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {imageLoaded && (
          <>
            {/* data de validade — shape rosa (Empresa: 2 linhas) */}
            <div
              className="absolute left-0 right-0 flex flex-col items-center justify-center"
              style={{ top: `${dateTopPct * 100}%`, height: isEmpresa ? '7%' : '5%' }}
            >
              {isEmpresa && (
                <span
                  className="font-bold tracking-wide"
                  style={{
                    fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(8px, 3vw, 15px)',
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    lineHeight: 1.1,
                  }}
                >
                  VALIDADE:
                </span>
              )}
              <span
                className="font-bold tracking-wide"
                style={{
                  fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(11px, 4vw, 21px)',
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {validadeStr}
              </span>
            </div>

            {/* código do voucher */}
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{ top: `${codeTopPct * 100}%`, height: '6%' }}
            >
              <span
                className="font-bold tracking-widest"
                style={{
                  fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                  fontSize: isEmpresa ? 'clamp(13px, 5vw, 26px)' : 'clamp(16px, 6vw, 32px)',
                  color: '#ffffff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  letterSpacing: isEmpresa ? '0.08em' : undefined,
                }}
              >
                {codigo}
              </span>
            </div>
          </>
        )}
      </div>

      {showDownload && (
        <button
          onClick={downloadPDF}
          className={`absolute bottom-2 right-2 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-all hover:scale-105 ${
            isEmpresa ? 'text-amber-600' : 'text-purple-700'
          }`}
          title="Baixar PDF"
        >
          <Download size={16} />
        </button>
      )}
    </div>
  );
}

// ── Geração individual (download avulso) ───────────────────────────────────
export async function generateSinglePDF(
  codigo: string,
  data_validade: string | null,
  isEmpresa = false,
): Promise<void> {
  const frentePath = isEmpresa ? EMPRESA_FRENTE : CORTESIAS_IMAGE;
  const codeTopPct = isEmpresa ? EMPRESA_CODE_Y : CORTESIAS_CODE_Y;
  const validadeStr = formatDate(data_validade);

  const frente = await loadImage(frentePath);
  const pdfW = 90;
  const pdfH = (frente.height / frente.width) * pdfW;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfW, pdfH] });
  pdf.addImage(frente, 'PNG', 0, 0, pdfW, pdfH);
  pdf.setFont('Helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(isEmpresa ? 14 : 20);
  pdf.text(codigo, pdfW / 2, pdfH * codeTopPct, { align: 'center' });

  if (isEmpresa) {
    pdf.setFontSize(8);
    pdf.text('VALIDADE:', pdfW / 2, pdfH * EMPRESA_DATE_LABEL_Y, { align: 'center' });
    pdf.setFontSize(11);
    pdf.text(validadeStr, pdfW / 2, pdfH * EMPRESA_DATE_VALUE_Y, { align: 'center' });
    const verso = await loadImage(EMPRESA_VERSO);
    const versoH = (verso.height / verso.width) * pdfW;
    pdf.addPage([pdfW, versoH], 'portrait');
    pdf.addImage(verso, 'PNG', 0, 0, pdfW, versoH);
  } else {
    pdf.setFontSize(13);
    pdf.text(validadeStr, pdfW / 2, pdfH * CORTESIAS_DATE_Y, { align: 'center' });
  }

  const prefix = isEmpresa ? 'ingresso' : 'cortesia';
  pdf.save(`${prefix}-${codigo}.pdf`);
}

// ── Geração em lote ────────────────────────────────────────────────────────
export async function generateBatchPDF(
  codigos: string[],
  data_validade: string | null,
  solicitante: string,
  isEmpresa = false,
): Promise<void> {
  const frentePath = isEmpresa ? EMPRESA_FRENTE  : CORTESIAS_IMAGE;
  const codeYPct   = isEmpresa ? EMPRESA_CODE_Y  : CORTESIAS_CODE_Y;
  const dateYPct   = isEmpresa ? EMPRESA_DATE_LABEL_Y : CORTESIAS_DATE_Y;
  const validadeStr = formatDate(data_validade);

  const frente = await loadImage(frentePath);
  const verso  = isEmpresa ? await loadImage(EMPRESA_VERSO) : null;

  const ticketW  = 90;
  const ticketH  = (frente.height / frente.width) * ticketW;
  const margin   = 5;
  const pageW    = 210;
  const pageH    = 297;

  if (isEmpresa) {
    // Empresa: cada ingresso ocupa 2 páginas (frente + verso)
    const versoH = verso ? (verso.height / verso.width) * ticketW : ticketH;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    codigos.forEach((codigo, index) => {
      if (index > 0) pdf.addPage();

      // página da frente — centralizado na A4
      const x = (pageW - ticketW) / 2;
      const y = (pageH - ticketH) / 2;

      pdf.addImage(frente, 'PNG', x, y, ticketW, ticketH);
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);

      pdf.setFontSize(14);
      pdf.text(codigo, x + ticketW / 2, y + ticketH * codeYPct, { align: 'center' });
      pdf.setFontSize(8);
      pdf.text('VALIDADE:', x + ticketW / 2, y + ticketH * EMPRESA_DATE_LABEL_Y, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(validadeStr, x + ticketW / 2, y + ticketH * EMPRESA_DATE_VALUE_Y, { align: 'center' });

      // página do verso
      pdf.addPage();
      if (verso) {
        const vx = (pageW - ticketW) / 2;
        const vy = (pageH - versoH) / 2;
        pdf.addImage(verso, 'PNG', vx, vy, ticketW, versoH);
      }
    });

    const nome = solicitante.replace(/\s+/g, '-').toLowerCase();
    pdf.save(`ingressos-${nome}-${codigos.length}un.pdf`);

  } else {
    // Cortesias: layout em grade 2 colunas na A4
    const cols = 2;
    const rows = Math.floor((pageH - 2 * margin) / (ticketH + margin));
    const ticketsPerPage = cols * rows;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const drawTicket = (x: number, y: number, codigo: string) => {
      pdf.addImage(frente, 'PNG', x, y, ticketW, ticketH);
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);

      pdf.setFontSize(18);
      pdf.text(codigo,      x + ticketW / 2, y + ticketH * codeYPct, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(validadeStr, x + ticketW / 2, y + ticketH * dateYPct, { align: 'center' });
    };

    codigos.forEach((codigo, index) => {
      if (index > 0 && index % ticketsPerPage === 0) pdf.addPage();

      const pageIndex  = index % ticketsPerPage;
      const col        = pageIndex % cols;
      const row        = Math.floor(pageIndex / cols);
      const totalWidth = cols * ticketW + (cols - 1) * margin;
      const startX     = (pageW - totalWidth) / 2;

      drawTicket(startX + col * (ticketW + margin), margin + row * (ticketH + margin), codigo);
    });

    const nome = solicitante.replace(/\s+/g, '-').toLowerCase();
    pdf.save(`cortesias-${nome}-${codigos.length}un.pdf`);
  }
}
