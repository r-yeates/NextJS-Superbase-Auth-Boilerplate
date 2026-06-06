'use client'

import { getPasswordRules } from '@/lib/validation/password'

const rules = getPasswordRules()

interface PasswordRequirementsProps {
  password: string
  className?: string
}

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  return (
    <div className={`mt-3 rounded-md bg-gray-50 p-4 ${className}`}>
      <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
      <ul className="space-y-2" role="list" aria-label="Password requirements">
        {rules.map((rule) => {
          const satisfied = rule.validate(password)
          return (
            <li
              key={rule.id}
              className="flex items-start gap-2 text-sm"
              aria-label={`${rule.label} - ${satisfied ? 'satisfied' : 'not satisfied'}`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                  satisfied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'
                }`}
                aria-hidden="true"
              >
                {satisfied ? (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                  </svg>
                ) : (
                  <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                )}
              </span>
              <span className={satisfied ? 'text-green-700 font-medium' : 'text-gray-600'}>
                {rule.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
