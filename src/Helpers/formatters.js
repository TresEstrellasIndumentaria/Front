export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const formatCurrencyARS = (value, options = {}) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: options.minimumFractionDigits,
  maximumFractionDigits: options.maximumFractionDigits ?? 2,
}).format(toNumber(value));

export const formatDateAR = (value) => {
  if (!value) return '-';

  const dateString = String(value);
  const dateOnlyMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z?$)/);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-AR').format(date);
};

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthRange = () => {
  const now = new Date();

  return {
    desde: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    hasta: toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

export const getCurrentMonthToDateRange = () => {
  const now = new Date();

  return {
    desde: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    hasta: toDateInputValue(now),
  };
};

export const formatOrdenNumero = (numero) => {
  if (!numero) return '-';
  return String(numero).replace(/^PO/i, '');
};
