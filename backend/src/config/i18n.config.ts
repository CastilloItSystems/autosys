// backend/src/config/i18n.config.ts

interface Translation {
  [key: string]: string | Translation
}

interface Translations {
  es: Translation
}

export const translations: Translations = {
  es: {
    common: {
      created: '{{entity}} creado exitosamente',
      updated: '{{entity}} actualizado exitosamente',
      deleted: '{{entity}} eliminado exitosamente',
      notFound: '{{entity}} no encontrado',
      alreadyExists: '{{entity}} ya existe',
      required: '{{field}} es requerido',
      invalid: '{{field}} inválido',
      success: 'Operación exitosa',
      error: 'Ha ocurrido un error',
      unauthorized: 'No autorizado',
      forbidden: 'Acceso denegado',
      serverError: 'Error interno del servidor',
    },
    validation: {
      email: 'Email inválido',
      phone: 'Teléfono inválido',
      date: 'Fecha inválida',
      number: 'Debe ser un número',
      positive: 'Debe ser un número positivo',
      min: 'El valor mínimo es {{min}}',
      max: 'El valor máximo es {{max}}',
      minLength: 'La longitud mínima es {{min}} caracteres',
      maxLength: 'La longitud máxima es {{max}} caracteres',
    },
  },
}

export const t = (key: string, params: Record<string, any> = {}): string => {
  const keys = key.split('.')
  let value: any = translations.es

  for (const k of keys) {
    value = value[k]
    if (!value) return key
  }

  if (typeof value !== 'string') return key

  // Reemplazar parámetros
  return Object.entries(params).reduce(
    (str, [key, val]) =>
      str.replace(new RegExp(`{{${key}}}`, 'g'), String(val)),
    value
  )
}

export default { translations, t }
