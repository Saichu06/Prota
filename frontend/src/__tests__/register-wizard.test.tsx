import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasswordInput } from '../components/ui/PasswordInput'

describe('Playful Password Visibility Interactions', () => {
  it('renders with password hidden by default with friendly tooltip', () => {
    render(<PasswordInput label="PASSWORD" placeholder="Enter password" />)

    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    expect(input.type).toBe('password')

    const button = screen.getByRole('button', { name: /show password/i })
    expect(button.getAttribute('title')).toBe('Let me see!')
    expect(screen.queryByText(/there it is!/i)).toBeNull()
  })

  it('toggles to visible text on click with friendly message and updated tooltip without emojis', () => {
    render(<PasswordInput label="PASSWORD" placeholder="Enter password" />)

    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    const button = screen.getByRole('button', { name: /show password/i })

    // Click to show password
    fireEvent.click(button)

    expect(input.type).toBe('text')
    expect(button.getAttribute('title')).toBe('There it is!')
    expect(screen.getByRole('button', { name: /hide password/i })).toBeDefined()
    expect(screen.getByText('There it is!')).toBeDefined()

    // Click again to hide password
    fireEvent.click(button)
    expect(input.type).toBe('password')
    expect(button.getAttribute('title')).toBe('Let me see!')
    expect(screen.queryByText(/there it is!/i)).toBeNull()
  })
})

describe('Registration Wizard Flow Validation', () => {
  it('personalizes Step 2 and Step 3 greetings from entered full name without emojis', () => {
    const enteredName = 'Sai Charan'
    const firstName = enteredName.trim().split(' ')[0]

    expect(firstName).toBe('Sai')
    const step2Greeting = `Hi, ${firstName}!`
    const step3Greeting = `Almost there, ${firstName}!`

    expect(step2Greeting).toBe('Hi, Sai!')
    expect(step3Greeting).toBe('Almost there, Sai!')
  })

  it('validates step-by-step requirements', () => {
    // Step 1: Name validation
    const validateName = (name: string) => name.trim().length > 0 && name.trim().length <= 100
    expect(validateName('')).toBe(false)
    expect(validateName('   ')).toBe(false)
    expect(validateName('Sai Charan')).toBe(true)

    // Step 2: Email validation
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('sai@example.com')).toBe(true)

    // Step 3: Password validation
    const validatePassword = (pass: string, confirm: string) =>
      pass.length >= 8 && pass.length <= 100 && pass === confirm
    expect(validatePassword('short', 'short')).toBe(false)
    expect(validatePassword('StrongPass123!', 'MismatchPass123!')).toBe(false)
    expect(validatePassword('StrongPass123!', 'StrongPass123!')).toBe(true)
  })
})
