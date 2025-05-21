import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number | null | undefined;
  suffix?: string;
  decimals?: number;
}

export function AnimatedNumber(props: AnimatedNumberProps) {
  const { value = 0, suffix, decimals = 0 } = props;
  const numericValue = typeof value === 'number' ? value : 0;

  // Sayıyı biçimlendir
  let formattedValue = '';
  try {
    if (decimals > 0) {
      formattedValue = numericValue.toFixed(decimals);
    } else {
      formattedValue = Math.round(numericValue).toString();
    }
  } catch (error) {
    formattedValue = '0';
  }

  // Binlik ayırıcı ekle
  formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return (
    <span>
      {formattedValue}
      {suffix && ` ${suffix}`}
    </span>
  );
} 