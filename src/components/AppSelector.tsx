import { useState } from 'react';
import { useApp, AppMode } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Ticket, Briefcase, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function AppSelector() {
  const { setAppMode } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState<AppMode | null>(null);
  const [selecting, setSelecting] = useState<AppMode | null>(null);
  const isDark = theme === 'dark';

  const handleSelect = (mode: AppMode) => {
    setSelecting(mode);
    setTimeout(() => setAppMode(mode), 400);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-900'}`}>

      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, #a700ff, transparent)',
            left: hovered === 'cortesias' ? '10%' : '-10%',
            top: '20%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, #f59e0b, transparent)',
            right: hovered === 'empresa' ? '10%' : '-10%',
            top: '20%',
            transform: 'translate(50%, -50%)',
          }}
        />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
          aria-label="Alternar tema"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-8 px-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a700ff] to-[#ea0cac] flex items-center justify-center shadow-lg shadow-[#a700ff]/30">
            <Ticket size={20} className="text-white" />
          </div>
          <span className="text-3xl font-black text-white tracking-tight">CINEX</span>
        </div>
        <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Sistema de Ingressos</p>
        <div className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Cards */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-4xl">
          <p className="text-center text-white/50 text-sm font-medium mb-8 tracking-wider uppercase">
            Selecione o sistema
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* CORTESIAS */}
            <button
              onClick={() => handleSelect('cortesias')}
              onMouseEnter={() => setHovered('cortesias')}
              onMouseLeave={() => setHovered(null)}
              disabled={!!selecting}
              className={`group relative rounded-2xl border overflow-hidden text-left transition-all duration-300 ${
                selecting === 'cortesias' ? 'scale-95 opacity-70' : 'hover:scale-[1.02]'
              } ${
                hovered === 'cortesias'
                  ? 'border-[#a700ff]/60 shadow-2xl shadow-[#a700ff]/20'
                  : 'border-white/10 hover:border-[#a700ff]/40'
              }`}
              style={{
                background: hovered === 'cortesias'
                  ? 'linear-gradient(135deg, #1a052b 0%, #2d0047 50%, #1a0a24 100%)'
                  : 'linear-gradient(135deg, #110320 0%, #1a0a24 100%)',
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#a700ff] to-transparent opacity-60" />

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(167,0,255,0.08), transparent 60%)' }}
              />

              <div className="relative p-8">
                {/* Icon */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#a700ff]/30 to-[#ea0cac]/20 border border-[#a700ff]/30 group-hover:from-[#a700ff]/40 group-hover:to-[#ea0cac]/30 transition-all">
                    <Sparkles size={26} className="text-[#ea0cac]" />
                  </div>
                </div>

                {/* Label */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a700ff]/70 bg-[#a700ff]/10 px-2 py-0.5 rounded-full border border-[#a700ff]/20">
                    Cortesias
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                  Cinex<br />
                  <span className="bg-gradient-to-r from-[#a700ff] to-[#ea0cac] bg-clip-text text-transparent">
                    Cortesias
                  </span>
                </h2>

                <p className="text-white/50 text-sm leading-relaxed mb-8">
                  Gerencie ingressos cortesia. Importe códigos, distribua para solicitantes e acompanhe o status de cada lote.
                </p>

                <div className="flex items-center gap-2 text-[#ea0cac] text-sm font-semibold group-hover:gap-3 transition-all">
                  Acessar sistema
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bottom badge */}
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a700ff]/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea0cac]/60" />
              </div>
            </button>

            {/* EMPRESA */}
            <button
              onClick={() => handleSelect('empresa')}
              onMouseEnter={() => setHovered('empresa')}
              onMouseLeave={() => setHovered(null)}
              disabled={!!selecting}
              className={`group relative rounded-2xl border overflow-hidden text-left transition-all duration-300 ${
                selecting === 'empresa' ? 'scale-95 opacity-70' : 'hover:scale-[1.02]'
              } ${
                hovered === 'empresa'
                  ? 'border-[#f59e0b]/60 shadow-2xl shadow-[#f59e0b]/20'
                  : 'border-white/10 hover:border-[#f59e0b]/40'
              }`}
              style={{
                background: hovered === 'empresa'
                  ? 'linear-gradient(135deg, #0a1628 0%, #0f2035 50%, #0d1b2a 100%)'
                  : 'linear-gradient(135deg, #070f1c 0%, #0d1b2a 100%)',
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent opacity-60" />

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at 70% 30%, rgba(245,158,11,0.06), transparent 60%)' }}
              />

              <div className="relative p-8">
                {/* Icon */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f59e0b]/20 to-[#0ea5e9]/20 border border-[#f59e0b]/30 group-hover:from-[#f59e0b]/30 group-hover:to-[#0ea5e9]/20 transition-all">
                    <Building2 size={26} className="text-[#f59e0b]" />
                  </div>
                </div>

                {/* Label */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]/70 bg-[#f59e0b]/10 px-2 py-0.5 rounded-full border border-[#f59e0b]/20">
                    Corporativo
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                  Cinex<br />
                  <span className="bg-gradient-to-r from-[#f59e0b] to-[#0ea5e9] bg-clip-text text-transparent">
                    Empresa
                  </span>
                </h2>

                <p className="text-white/50 text-sm leading-relaxed mb-8">
                  Gestão corporativa de ingressos. Importe vouchers, selecione quantidades e gere ingressos diretamente do pool.
                </p>

                <div className="flex items-center gap-2 text-[#f59e0b] text-sm font-semibold group-hover:gap-3 transition-all">
                  Acessar sistema
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bottom badge */}
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]/60" />
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6 text-white/20 text-xs">
        v3.0.0 &mdash; 2025 Cinex
      </div>
    </div>
  );
}
