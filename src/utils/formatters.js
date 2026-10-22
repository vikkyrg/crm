/**
 * Format currency to standard Indian Rupee format (e.g. ₹1,50,000.00)
 */
export const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Format standard readable date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Line item financial calculations for instant frontend calculation
 */
export const calculateClientLine = (line, isInterState = false) => {
  const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
  const quantity = Math.max(0, Number(line.quantity) || 0);
  const discountPercent = Math.min(100, Math.max(0, Number(line.discountPercent) || 0));

  const gross = Math.round((unitPrice * quantity) * 100) / 100;
  const discountAmount = Math.round(((gross * discountPercent) / 100) * 100) / 100;
  const taxableAmount = Math.max(0, Math.round((gross - discountAmount) * 100) / 100);

  const taxRate = Math.max(0, Number(line.taxRate) || 0);
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  } else {
    cgstAmount = Math.round(((taxableAmount * (taxRate / 2)) / 100) * 100) / 100;
    sgstAmount = Math.round(((taxableAmount * (taxRate / 2)) / 100) * 100) / 100;
  }

  const totalTax = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
  const lineTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  return {
    ...line,
    gross,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    lineTotal
  };
};

/**
 * Rounds number to 2 decimal places reliably
 */
export const round2 = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Mask sensitive bank account digits (e.g. •••• •••• 1234)
 */
export const maskAccountNumber = (acc) => {
  if (!acc) return 'N/A';
  const str = String(acc).trim();
  if (str.length <= 4) return str;
  return `•••• •••• ${str.slice(-4)}`;
};

/**
 * Convert number to Indian Rupee Words
 */
export const numberToWordsINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(Math.abs(num))).substr(-9);
  const match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return '';

  let str = '';
  str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0]] + ' ' + a[match[1][1]]) + 'Crore ' : '';
  str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0]] + ' ' + a[match[2][1]]) + 'Lakh ' : '';
  str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0]] + ' ' + a[match[3][1]]) + 'Thousand ' : '';
  str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0]] + ' ' + a[match[4][1]]) + 'Hundred ' : '';
  str += Number(match[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[match[5][0]] + ' ' + a[match[5][1]]) : '';

  if (!str.trim()) {
    str = 'Zero ';
  }

  const paise = Math.round((Math.abs(num) - Math.floor(Math.abs(num))) * 100);
  let paiseStr = '';
  if (paise > 0) {
    paiseStr = ' and ' + (a[paise] || b[Math.floor(paise / 10)] + ' ' + a[paise % 10]) + 'Paise';
  }

  return (num < 0 ? 'Minus ' : '') + str.trim() + ' Rupees' + paiseStr + ' Only';
};
