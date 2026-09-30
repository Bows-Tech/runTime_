/**
 * Datos bancarios para el cobro por transferencia.
 *
 * Se leen de variables de entorno para no publicarlos en el bundle: los
 * datos de la cuenta van en el servidor y el navegador los recibe ya
 * renderizados por la página de instrucciones.
 *
 * Añade esto a .env.local y al README cuando configures tu cuenta.
 */
export type BankInfo = {
  banco: string;
  tipoCuenta: string;
  numero: string;
  titular: string;
  whatsapp: string;
  email: string;
};

export function getBankInfo(): BankInfo {
  return {
    banco: process.env.BANK_NAME || 'Banco de ejemplo',
    tipoCuenta: process.env.BANK_ACCOUNT_TYPE || 'Corriente',
    numero: process.env.BANK_ACCOUNT_NUMBER || '0000000000',
    titular: process.env.BANK_ACCOUNT_HOLDER || 'Configura esto en .env.local',
    whatsapp: process.env.BANK_WHATSAPP || '',
    email: process.env.BANK_EMAIL || '',
  };
}

/** Datos incompletos: la página avisa en vez de mostrar datos falsos. */
export function isBankInfoConfigured(info: BankInfo): boolean {
  return Boolean(
    process.env.BANK_ACCOUNT_NUMBER &&
      process.env.BANK_ACCOUNT_HOLDER &&
      info.numero !== '0000000000',
  );
}
