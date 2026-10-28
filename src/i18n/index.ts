/**
 * PersianBearStudio — dictionary access.
 *
 * `getDictionary` is used from the browser (form UI + rendered errors)
 * and from the server (localised API responses). `interpolate`
 * substitutes {param} placeholders in localised messages.
 */

import type { SupportedLang } from '../lib/types';
import { en } from './en';
import { fa } from './fa';
import type { Dictionary } from './types';

const DICTIONARIES: Record<SupportedLang, Dictionary> = { en, fa };

export function getDictionary(lang: SupportedLang): Dictionary {
  return DICTIONARIES[lang] ?? en;
}

/** Replaces `{name}` placeholders with values from `params`. */
export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : match,
  );
}

export type { Dictionary };
