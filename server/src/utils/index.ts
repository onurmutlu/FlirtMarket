import { randomBytes } from 'crypto';

/**
 * 8 karakterlik benzersiz bir referral kodu oluşturur
 * @returns Referral kodu (örn: 'X7A2B9C1')
 */
export function generateReferralCode(): string {
  const randomStr = randomBytes(4).toString('hex').toUpperCase();
  // İlk 8 karakteri al
  return randomStr.substring(0, 8);
}

/**
 * Verilen bir dizgeyi güvenli bir şekilde kısaltır
 * @param str Kısaltılacak dizge
 * @param maxLength Maksimum uzunluk
 * @param suffix Kısaltma varsa eklenecek son ek (varsayılan: '...')
 * @returns Kısaltılmış dizge
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * İki tarih arasındaki farkı insanların okuyabileceği formatta döndürür
 * @param date1 İlk tarih
 * @param date2 İkinci tarih (verilmezse şu anki zaman kullanılır)
 * @returns İnsan tarafından okunabilir zaman farkı dizgesi
 */
export function getHumanReadableTimeDiff(date1: Date, date2: Date = new Date()): string {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} gün önce`;
  }
  if (diffHours > 0) {
    return `${diffHours} saat önce`;
  }
  if (diffMins > 0) {
    return `${diffMins} dakika önce`;
  }
  return 'az önce';
}

/**
 * Verilen bir tutarı para birimine formatlar
 * @param amount Tutar
 * @param currency Para birimi (varsayılan: TRY)
 * @returns Formatlanmış para tutarı
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency
  }).format(amount);
} 