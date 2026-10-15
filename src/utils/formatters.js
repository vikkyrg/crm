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
