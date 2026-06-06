/**
 * Password Validation Configuration
 * 
 * Single source of truth for password requirements.
 * Used by both client-side UI feedback and server-side validation.
 * 
 * Adjust these values to match your security requirements.
 */

export interface PasswordRule {
  /** Unique identifier for the rule */
  id: string
  /** Human-readable description shown to users */
  label: string
  /** Validation function that returns true if password meets the rule */
  validate: (password: string) => boolean
  /** Optional: Error message when validation fails (for server-side) */
  errorMessage?: string
}

export interface PasswordRequirements {
  /** Minimum password length */
  minLength: number
  /** Maximum password length (bcrypt silently truncates at 72 bytes) */
  maxLength?: number
  /** Require at least one uppercase letter */
  requireUppercase: boolean
  /** Require at least one lowercase letter */
  requireLowercase: boolean
  /** Require at least one number */
  requireNumber: boolean
  /** Require at least one special character */
  requireSpecialChar: boolean
  /** Custom special characters to require (default: !@#$%^&*()_+-=[]{}|;:,.<>?) */
  specialCharacters?: string
}

/**
 * Password Requirements Configuration
 * 
 * ADJUST THESE VALUES to change password strength requirements.
 * Changes here will automatically update both client and server validation.
 */
export const PASSWORD_CONFIG: PasswordRequirements = {
  minLength: 6,
  maxLength: 72,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialCharacters: '!@#$£%^&*()_+-=[]{}|;:,.<>?',
}

/**
 * Generate password validation rules from configuration
 * 
 * This function creates the actual validation rules based on the config.
 * It's used by both client and server to ensure consistent validation.
 */
export function getPasswordRules(config: PasswordRequirements = PASSWORD_CONFIG): PasswordRule[] {
  const rules: PasswordRule[] = []

  // Minimum length rule
  rules.push({
    id: 'minLength',
    label: `At least ${config.minLength} characters`,
    validate: (password) => password.length >= config.minLength,
    errorMessage: `Password must be at least ${config.minLength} characters long`,
  })

  // Maximum length rule (bcrypt truncates at 72 bytes, so cap here)
  if (config.maxLength) {
    rules.push({
      id: 'maxLength',
      label: `No more than ${config.maxLength} characters`,
      validate: (password) => password.length <= config.maxLength!,
      errorMessage: `Password must be no more than ${config.maxLength} characters long`,
    })
  }

  // Uppercase letter rule
  if (config.requireUppercase) {
    rules.push({
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      validate: (password) => /[A-Z]/.test(password),
      errorMessage: 'Password must contain at least one uppercase letter',
    })
  }

  // Lowercase letter rule
  if (config.requireLowercase) {
    rules.push({
      id: 'lowercase',
      label: 'At least one lowercase letter (a-z)',
      validate: (password) => /[a-z]/.test(password),
      errorMessage: 'Password must contain at least one lowercase letter',
    })
  }

  // Number rule
  if (config.requireNumber) {
    rules.push({
      id: 'number',
      label: 'At least one number (0-9)',
      validate: (password) => /[0-9]/.test(password),
      errorMessage: 'Password must contain at least one number',
    })
  }

  // Special character rule
  if (config.requireSpecialChar) {
    const specialChars = config.specialCharacters || '!@#$£%^&*()_+-=[]{}|;:,.<>?'
    const escapedChars = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharRegex = new RegExp(`[${escapedChars}]`)

    rules.push({
      id: 'specialChar',
      label: `At least one special character (${specialChars.slice(0, 10)}...)`,
      validate: (password) => {
        // Remove letters and numbers, then check if any special chars remain
        const withoutLettersAndNumbers = password.replace(/[a-zA-Z0-9]/g, '')
        return specialCharRegex.test(withoutLettersAndNumbers)
      },
      errorMessage: 'Password must contain at least one special character',
    })
  }

  return rules
}

/**
 * Validate password against all configured rules
 * 
 * @param password - The password to validate
 * @returns Object with validation result and any failed rules
 */
export function validatePassword(password: string): {
  isValid: boolean
  failedRules: PasswordRule[]
  errors: string[]
} {
  const rules = getPasswordRules()
  const failedRules = rules.filter(rule => !rule.validate(password))
  
  return {
    isValid: failedRules.length === 0,
    failedRules,
    errors: failedRules.map(rule => rule.errorMessage || rule.label),
  }
}

