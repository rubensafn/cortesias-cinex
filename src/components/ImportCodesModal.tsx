import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Database, Calendar } from 'lucide-react';

interface ImportCodesModalProps {
  onClose: () => void;
}

interface ImportResult {
  total: number;
  inserted: number;
  duplicates: number;
  errors: number;
}

interface PoolStats {
  available: number;
  used: number;
  expired: number;
  total: number;
}

interface ParsedRow {
  code: string;
  expiry_date: string;
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim().replace(/['"]/g, '');
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const brMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const brShort = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/);
  if (brShort) {
    const [, d, m, yy] = brShort;
    const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

export default function ImportCodesModal({ onClose }: ImportCodesModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const { data, error: statsError } = await supabase
      .from('imported_codes')
      .select('used, expiry_date');

    if (!statsError && data) {
      const today = new Date().toISOString().split('T')[0];
      const available = data.filter(r => !r.used && r.expiry_date >= today).length;
      const used = data.filter(r => r.used).length;
      const expired = data.filter(r => !r.used && r.expiry_date < today).length;
      setStats({ available, used, expired, total: data.length });
    }
    setLoadingStats(false);
  }, []);

  useState(() => {
    loadStats();
  });

  const parseCSV = (text: string): { rows: ParsedRow[]; errors: string[] } => {
    const rows: ParsedRow[] = [];
    const errors: string[] = [];
    const seenCodes = new Set<string>();
    const lines = text.split(/\r?\n/);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(/[,;\t]/);
      const rawCode = cols[0]?.trim().replace(/['"]/g, '').toUpperCase();
      const rawDate = cols[1]?.trim() || '';

      if (!rawCode || rawCode.length < 3) {
        errors.push(`Linha ${i + 1}: codigo invalido ou vazio`);
        continue;
      }

      const expiryDate = parseDate(rawDate);
      if (!expiryDate) {
        errors.push(`Linha ${i + 1}: data de validade invalida ("${rawDate}")`);
        continue;
      }

      if (seenCodes.has(rawCode)) {
        errors.push(`Linha ${i + 1}: codigo "${rawCode}" duplicado no arquivo`);
        continue;
      }

      seenCodes.add(rawCode);
      rows.push({ code: rawCode, expiry_date: expiryDate });
    }

    return { rows, errors };
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError('');
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setPreview(rows);
      setParseErrors(errors);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setLoading(true);
    setError('');

    const BATCH_SIZE = 500;
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;

    const rows = preview.map(row => ({
      code: row.code,
      expiry_date: row.expiry_date,
      used: false,
      imported_by: user?.id ?? null,
    }));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error: insertError, data } = await supabase
        .from('imported_codes')
        .upsert(batch, { onConflict: 'code', ignoreDuplicates: true })
        .select('id');

      if (insertError) {
        errors += batch.length;
      } else {
        const insertedCount = data?.length ?? 0;
        inserted += insertedCount;
        duplicates += batch.length - insertedCount;
      }
    }

    setResult({ total: preview.length, inserted, duplicates, errors });
    await loadStats();
    setLoading(false);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setParseErrors([]);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDateBR = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border ${
          isDark ? 'bg-[#1a0a24] border-[#a700ff]/30' : 'bg-white border-gray-200'
        }`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#a700ff]/20' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#ea0cac]/20' : 'bg-[#ea0cac]/10'}`}>
              <Upload className="text-[#ea0cac]" size={22} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Importar Vouchers</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Importe vouchers com codigo e validade de uma planilha CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#330054] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className={`rounded-xl p-4 border flex items-center gap-4 ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-gray-50 border-gray-200'}`}>
            <Database className="text-[#a700ff]" size={20} />
            {loadingStats ? (
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Carregando estatisticas...</span>
            ) : stats ? (
              <div className="flex gap-5 text-sm flex-wrap">
                <div>
                  <span className={`font-bold text-lg ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.available.toLocaleString()}</span>
                  <span className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>disponiveis</span>
                </div>
                <div>
                  <span className={`font-bold text-lg ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>{stats.expired.toLocaleString()}</span>
                  <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>vencidos</span>
                </div>
                <div>
                  <span className={`font-bold text-lg ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{stats.used.toLocaleString()}</span>
                  <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>utilizados</span>
                </div>
                <div>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total.toLocaleString()}</span>
                  <span className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>total</span>
                </div>
              </div>
            ) : (
              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum voucher no banco ainda</span>
            )}
          </div>

          {!result && (
            <>
              <div className={`rounded-xl p-3 border text-sm ${isDark ? 'bg-[#330054]/50 border-[#a700ff]/20 text-gray-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                <p className="font-semibold mb-1">Formato esperado da planilha:</p>
                <p>Coluna A: <strong>Codigo do Voucher</strong> | Coluna B: <strong>Data de Validade</strong></p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-blue-600'}`}>A linha 1 (cabecalho) sera ignorada. Datas aceitas: DD/MM/AAAA ou AAAA-MM-DD</p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? isDark ? 'border-[#ea0cac] bg-[#ea0cac]/10' : 'border-[#ea0cac] bg-[#ea0cac]/5'
                    : file
                      ? isDark ? 'border-[#a700ff] bg-[#a700ff]/10' : 'border-[#a700ff] bg-[#a700ff]/5'
                      : isDark ? 'border-[#a700ff]/30 hover:border-[#a700ff]/60 hover:bg-[#a700ff]/5' : 'border-gray-300 hover:border-[#a700ff] hover:bg-[#a700ff]/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="text-[#a700ff]" size={36} />
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{file.name}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {preview.length} vouchers detectados
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={isDark ? 'text-gray-500' : 'text-gray-400'} size={36} />
                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Arraste o arquivo ou clique para selecionar
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      CSV ou TXT com duas colunas: Codigo e Validade
                    </p>
                  </div>
                )}
              </div>

              {parseErrors.length > 0 && (
                <div className={`rounded-xl border p-4 ${isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    Avisos de importacao ({parseErrors.length})
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {parseErrors.slice(0, 20).map((err, i) => (
                      <p key={i} className={`text-xs ${isDark ? 'text-orange-300/80' : 'text-orange-700'}`}>{err}</p>
                    ))}
                    {parseErrors.length > 20 && (
                      <p className={`text-xs ${isDark ? 'text-orange-400/60' : 'text-orange-500'}`}>+{parseErrors.length - 20} mais...</p>
                    )}
                  </div>
                </div>
              )}

              {preview.length > 0 && (
                <div className={`rounded-xl border p-4 ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Pre-visualizacao ({preview.length} vouchers)
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {preview.slice(0, 40).map((row, i) => (
                      <div
                        key={i}
                        className={`font-mono text-xs px-2 py-1 rounded border flex items-center gap-1.5 ${
                          isDark ? 'bg-[#330054] border-[#a700ff]/30' : 'bg-white border-gray-300'
                        }`}
                      >
                        <span className={isDark ? 'text-[#ea0cac]' : 'text-[#a700ff]'}>{row.code}</span>
                        <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
                        <span className={`flex items-center gap-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Calendar size={10} />
                          {formatDateBR(row.expiry_date)}
                        </span>
                      </div>
                    ))}
                    {preview.length > 40 && (
                      <span className={`text-xs px-2 py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        +{preview.length - 40} mais...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm ${isDark ? 'bg-red-900/30 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={!preview.length || loading}
                  className="flex-1 bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-[#8a00d4] hover:to-[#c00a8f] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Importar {preview.length > 0 ? `${preview.length} Vouchers` : ''}
                    </>
                  )}
                </button>
                {file && (
                  <button
                    onClick={reset}
                    disabled={loading}
                    className={`px-5 py-3 rounded-xl font-semibold transition-colors ${isDark ? 'bg-[#330054] text-gray-300 hover:bg-[#a700ff]/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`rounded-xl p-6 border text-center ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${result.errors === 0 ? isDark ? 'bg-green-900/50' : 'bg-green-100' : isDark ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                  <CheckCircle className={result.errors === 0 ? isDark ? 'text-green-400' : 'text-green-600' : isDark ? 'text-yellow-400' : 'text-yellow-600'} size={32} />
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Importacao concluida</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                    <p className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-700'}`}>{result.inserted}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-green-400/70' : 'text-green-600'}`}>Importados</p>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                    <p className={`text-2xl font-black ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>{result.duplicates}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-yellow-400/70' : 'text-yellow-600'}`}>Duplicados</p>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
                    <p className={`text-2xl font-black ${isDark ? 'text-red-400' : 'text-red-700'}`}>{result.errors}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-red-400/70' : 'text-red-600'}`}>Erros</p>
                  </div>
                </div>
              </div>

              {stats && (
                <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pool atualizado</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Agora ha <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.available.toLocaleString()}</span> vouchers disponiveis para uso
                    {stats.expired > 0 && (
                      <> e <span className={`font-bold ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>{stats.expired.toLocaleString()}</span> vencidos</>
                    )}.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${isDark ? 'bg-[#330054] text-white hover:bg-[#a700ff]/30' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                >
                  Importar Mais
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white py-3 rounded-xl font-semibold hover:from-[#8a00d4] hover:to-[#c00a8f] transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
