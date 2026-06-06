export function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

export function getFormStringRequired(formData: FormData, key: string): string | null {
  const value = getFormString(formData, key)?.trim()
  return value || null
}
