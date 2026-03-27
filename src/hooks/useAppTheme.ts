import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';

export function useAppTheme() {
  const { appMode } = useApp();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const isEmpresa = appMode === 'empresa';

  // Raw colors para inline styles e focus rings
  const primary = isEmpresa ? '#f59e0b' : '#a700ff';
  const secondary = isEmpresa ? '#0ea5e9' : '#ea0cac';

  // Tailwind classes dinâmicas
  const pageBg = isDark
    ? (isEmpresa ? 'bg-[#080f1a]' : 'bg-[#1a0a24]')
    : (isEmpresa ? 'bg-slate-50' : 'bg-gray-50');

  const cardBg = isDark
    ? (isEmpresa ? 'bg-[#0f1f33] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20')
    : 'bg-white border-gray-100';

  const cardBgAlt = isDark
    ? (isEmpresa ? 'bg-[#0f1f33] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20')
    : (isEmpresa ? 'bg-white border-slate-200' : 'bg-white border-gray-200');

  const navBg = isDark
    ? (isEmpresa ? 'bg-[#060d17] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20')
    : (isEmpresa ? 'bg-[#0d1b2a] border-[#f59e0b]/30' : 'bg-white border-gray-200');

  const navText = isDark
    ? 'text-white'
    : (isEmpresa ? 'text-white' : 'text-gray-900');

  const primaryBtn = isEmpresa
    ? 'bg-gradient-to-r from-[#d97706] to-[#0284c7] hover:from-[#b45309] hover:to-[#0369a1]'
    : 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] hover:from-[#8a00d4] hover:to-[#c00a8f]';

  const primaryBtnRing = isEmpresa ? 'focus:ring-[#f59e0b]' : 'focus:ring-[#a700ff]';

  const activeNavBtn = isEmpresa
    ? 'bg-gradient-to-r from-[#d97706] to-[#0284c7] text-white'
    : 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white';

  const inactiveNavBtn = isDark
    ? (isEmpresa ? 'text-slate-400 hover:bg-[#0f1f33] hover:text-white' : 'text-gray-400 hover:bg-[#330054] hover:text-white')
    : (isEmpresa ? 'text-slate-200 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100');

  const inputBg = isDark
    ? (isEmpresa ? 'bg-[#0a1628] border-[#f59e0b]/30 text-white placeholder-slate-500' : 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500')
    : (isEmpresa ? 'bg-slate-50 border-slate-300 text-gray-900 placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400');

  const inputRing = isEmpresa ? 'focus:ring-[#f59e0b]' : 'focus:ring-[#a700ff]';

  const accentText = isDark
    ? (isEmpresa ? 'text-[#f59e0b]' : 'text-[#ea0cac]')
    : (isEmpresa ? 'text-[#d97706]' : 'text-[#a700ff]');

  const secondaryText = isDark
    ? (isEmpresa ? 'text-[#0ea5e9]' : 'text-[#a700ff]')
    : (isEmpresa ? 'text-[#0284c7]' : 'text-[#ea0cac]');

  const mobileMenuBg = isDark
    ? (isEmpresa ? 'border-[#f59e0b]/20 bg-[#060d17]' : 'border-[#a700ff]/20 bg-[#311b3c]')
    : (isEmpresa ? 'border-[#f59e0b]/30 bg-[#0d1b2a]' : 'border-gray-100 bg-white');

  // Labels por app
  const labels = {
    ticket: isEmpresa ? 'Ingresso' : 'Cortesia',
    tickets: isEmpresa ? 'Ingressos' : 'Cortesias',
    newTicket: isEmpresa ? 'Novo Ingresso' : 'Nova Cortesia',
    systemName: isEmpresa ? 'Cinex Empresa' : 'Cinex Cortesias',
    appSubtitle: isEmpresa ? 'Gestão Empresarial' : 'Cortesias',
    generateBtn: isEmpresa ? 'Gerar Ingressos' : 'Gerar Cortesias',
    listView: isEmpresa ? 'Ingressos' : 'Cortesias',
    formView: isEmpresa ? 'Novo Ingresso' : 'Nova Cortesia',
    successMsg: isEmpresa ? 'ingresso(s) gerado(s)!' : 'cortesia(s) gerada(s)!',
    emptyMsg: isEmpresa ? 'Nenhum ingresso encontrado.' : 'Nenhuma cortesia encontrada.',
    statsTitle: isEmpresa ? 'Ingressos' : 'Cortesias',
    totalLabel: isEmpresa ? 'Total de Ingressos' : 'Total de Cortesias',
    poolLabel: isEmpresa ? 'Pool de Vouchers' : 'Pool de Vouchers',
  };

  return {
    isDark,
    isEmpresa,
    primary,
    secondary,
    pageBg,
    cardBg,
    cardBgAlt,
    navBg,
    navText,
    primaryBtn,
    primaryBtnRing,
    activeNavBtn,
    inactiveNavBtn,
    inputBg,
    inputRing,
    accentText,
    secondaryText,
    mobileMenuBg,
    labels,
  };
}
