export const inputCls = (dark: boolean, ring = 'focus:ring-teal-500') =>
  `w-full p-3 rounded-xl text-sm border focus:outline-none focus:ring-2 ${ring} ${
    dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

export const cardCls = (dark: boolean) =>
  dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm';

export const modalCls = (dark: boolean) =>
  dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900';

export const labelCls = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5';

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '');