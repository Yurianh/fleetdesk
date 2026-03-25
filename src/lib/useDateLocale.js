import { fr, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

export function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language.startsWith('fr') ? fr : enUS
}
