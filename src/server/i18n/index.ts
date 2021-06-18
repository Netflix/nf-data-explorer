import i18next, { TFunction } from 'i18next';
import enUS from './locales/en-US';

export async function setupi18n(): Promise<void> {
  await i18next.init({
    lng: 'en-US',
    fallbackLng: 'en-US',
    resources: {
      'en-US': {
        translation: enUS,
      },
    } as any,
    interpolation: {
      format(value: string, format: string, _lng: string): string {
        if (value === undefined) {
          return value;
        }
        if (format === 'uppercase') {
          return value.toUpperCase();
        }
        if (format === 'lowercase') {
          return value.toLowerCase();
        }
        return value;
      },
    } as any,
  });
}

export function changeLanguage(language: string): Promise<TFunction> {
  return i18next.changeLanguage(language);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function t(key: string | string[], options?: any): string {
  return i18next.t(key, options);
}
