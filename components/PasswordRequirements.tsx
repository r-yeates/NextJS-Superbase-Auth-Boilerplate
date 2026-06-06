'use client'

import { getPasswordRules } from '@/lib/validation/password'
import { cn } from '@/lib/utils'
import { Check, Circle } from 'lucide-react'

const rules = getPasswordRules()

interface PasswordRequirementsProps {
  password: string
  className?: string
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  return (
    <div className={cn('mt-3 rounded-md border bg-muted/50 p-3', className)}>
      <p className="text-xs font-medium text-foreground mb-2">Password requirements:</p>
      <ul className="space-y-1.5" role="list" aria-label="Password requirements">
        {rules.map((rule) => {
          const satisfied = rule.validate(password)
          return (
            <li
              key={rule.id}
              className="flex items-center gap-2 text-xs"
              aria-label={`${rule.label} - ${satisfied ? 'satisfied' : 'not satisfied'}`}
            >
              {satisfied ? (
                <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              )}
              <span className={satisfied ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                {rule.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
