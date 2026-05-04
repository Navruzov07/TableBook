export const toUZS = (usd) => usd * 10000;

export const formatUZS = (amount) => {
  return `${amount.toLocaleString()} UZS`;
};
