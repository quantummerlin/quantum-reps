export const UNITS = ['kg', 'lb'];
export const KG_PER_LB = 0.45359237;

// All stored weights are kilograms; units only change how they are entered and shown.
export function toKg(value, unit) {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

export function fromKg(kg, unit) {
  const value = unit === 'lb' ? kg / KG_PER_LB : kg;
  return Math.round(value * 10) / 10;
}

export function formatWeight(kg, unit) {
  return `${fromKg(kg, unit)} ${unit.toUpperCase()}`;
}

// Converts a typed field value between units, leaving blank or invalid input blank.
export function convertField(value, from, to) {
  const number = Number(value);
  if (value === '' || !Number.isFinite(number) || number <= 0) return '';
  return fromKg(toKg(number, from), to);
}
