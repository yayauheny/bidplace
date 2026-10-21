import type { Href } from 'expo-router';

export const footerSupportLinks = [
  { label: 'Правила сервиса', href: '/legal/agreement' },
  { label: 'Правила авторов', href: '/legal/author-rules' },
  { label: 'Запрещённое и обращения', href: '/legal/prohibited' },
] satisfies Array<{ label: string; href: Href }>;

export const footerLegalLinks = [
  { label: 'Политика и cookies', href: '/legal/privacy' },
  { label: 'Согласие ПДн', href: '/legal/data-consent' },
] satisfies Array<{ label: string; href: Href }>;

export const operatorContact = 'mailto:work.evles@gmail.com';
