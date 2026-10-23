import { describe, it, expect } from 'vitest'

describe('Registration Form Validation', () => {
  const validateRegistration = (fullName: string, email: string, password: string, confirmPassword: string) => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Full name cannot exceed 100 characters'
    }

    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    return errors
  }

  it('rejects blank inputs', () => {
    const errors = validateRegistration('', '', '', '')
    expect(errors.fullName).toBe('Full name is required')
    expect(errors.email).toBe('Email address is required')
    expect(errors.password).toBe('Password is required')
    expect(errors.confirmPassword).toBe('Confirm your password')
  })

  it('rejects invalid email formats', () => {
    const errors = validateRegistration('John Doe', 'not-an-email', 'StrongPassword123!', 'StrongPassword123!')
    expect(errors.email).toBe('Please enter a valid email address')
  })

  it('rejects passwords under 8 characters', () => {
    const errors = validateRegistration('John Doe', 'john@example.com', 'short', 'short')
    expect(errors.password).toBe('Password must be at least 8 characters')
  })

  it('rejects mismatched password and confirmation', () => {
    const errors = validateRegistration('John Doe', 'john@example.com', 'ValidPassword123!', 'DifferentPassword456!')
    expect(errors.confirmPassword).toBe('Passwords do not match')
  })

  it('passes on valid registration input', () => {
    const errors = validateRegistration('John Doe', 'john@example.com', 'ValidPassword123!', 'ValidPassword123!')
    expect(Object.keys(errors).length).toBe(0)
  })
})

describe('Login Form Validation', () => {
  const validateLogin = (email: string, password: string) => {
    const errors: Record<string, string> = {}
    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    }
    return errors
  }

  it('rejects empty credentials', () => {
    const errors = validateLogin('', '')
    expect(errors.email).toBe('Email address is required')
    expect(errors.password).toBe('Password is required')
  })

  it('passes on valid credentials format', () => {
    const errors = validateLogin('john@example.com', 'password123')
    expect(Object.keys(errors).length).toBe(0)
  })
})

describe('Profile & Settings Validation', () => {
  const validateProfile = (fullName: string) => {
    if (!fullName.trim()) return 'Full name cannot be blank'
    if (fullName.trim().length > 100) return 'Full name cannot exceed 100 characters'
    return null
  }

  const validateSettings = (proteinGoalG: string, calorieGoalKcal: string, waterGoalMl: string) => {
    const errors: Record<string, string> = {}

    const proteinNum = parseFloat(proteinGoalG)
    if (isNaN(proteinNum) || proteinNum < 1) {
      errors.proteinGoalG = 'Protein goal must be at least 1.00 gram'
    } else if (proteinNum > 1000) {
      errors.proteinGoalG = 'Protein goal cannot exceed 1000 grams'
    }

    if (calorieGoalKcal && calorieGoalKcal.trim() !== '') {
      const calNum = parseFloat(calorieGoalKcal)
      if (isNaN(calNum) || calNum <= 0) {
        errors.calorieGoalKcal = 'Calorie goal must be a positive number'
      }
    }

    if (waterGoalMl && waterGoalMl.trim() !== '') {
      const waterNum = parseInt(waterGoalMl, 10)
      if (isNaN(waterNum) || waterNum <= 0) {
        errors.waterGoalMl = 'Water goal must be a positive integer in ml'
      }
    }

    return errors
  }

  it('validates profile full name bounds', () => {
    expect(validateProfile('')).toBe('Full name cannot be blank')
    expect(validateProfile('a'.repeat(101))).toBe('Full name cannot exceed 100 characters')
    expect(validateProfile('Valid Name')).toBeNull()
  })

  it('validates protein goal boundaries', () => {
    expect(validateSettings('0', '', '').proteinGoalG).toBe('Protein goal must be at least 1.00 gram')
    expect(validateSettings('1001', '', '').proteinGoalG).toBe('Protein goal cannot exceed 1000 grams')
    expect(validateSettings('150.5', '', '').proteinGoalG).toBeUndefined()
  })

  it('validates optional calorie and water goals', () => {
    const valid = validateSettings('150', '2200', '3000')
    expect(Object.keys(valid).length).toBe(0)

    const invalid = validateSettings('150', '-50', 'not-a-number')
    expect(invalid.calorieGoalKcal).toBe('Calorie goal must be a positive number')
    expect(invalid.waterGoalMl).toBe('Water goal must be a positive integer in ml')
  })
})
