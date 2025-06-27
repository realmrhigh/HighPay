// Password policy utility functions
export const passwordPolicy = {
  // Minimum requirements
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  
  // Advanced requirements
  maxLength: 128,
  preventCommonPasswords: true,
  preventSequentialChars: true,
  preventRepeatingChars: true,
  maxRepeatingChars: 2,

  // Validation function
  validate(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors, strength: 0 };
    }

    // Length check
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    if (password.length > this.maxLength) {
      errors.push(`Password must not exceed ${this.maxLength} characters`);
    }

    // Character type requirements
    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.requireSpecialChars) {
      const specialChars = password.match(/[!@#$%^&*(),.?":{}|<>]/g);
      if (!specialChars || specialChars.length < this.minSpecialChars) {
        errors.push(`Password must contain at least ${this.minSpecialChars} special character(s)`);
      }
    }

    // Advanced checks
    if (this.preventSequentialChars && this.hasSequentialChars(password)) {
      errors.push('Password cannot contain sequential characters (e.g., abc, 123)');
    }

    if (this.preventRepeatingChars && this.hasExcessiveRepeatingChars(password)) {
      errors.push(`Password cannot have more than ${this.maxRepeatingChars} repeating characters in a row`);
    }

    if (this.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    // Calculate strength
    const strength = this.calculateStrength(password);

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      strengthLabel: this.getStrengthLabel(strength)
    };
  },

  // Check for sequential characters
  hasSequentialChars(password) {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.slice(i, i + 3);
        if (password.includes(subseq) || password.includes(subseq.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  },

  // Check for excessive repeating characters
  hasExcessiveRepeatingChars(password) {
    for (let i = 0; i <= password.length - this.maxRepeatingChars - 1; i++) {
      const char = password[i];
      let count = 1;
      
      for (let j = i + 1; j < password.length && password[j] === char; j++) {
        count++;
      }
      
      if (count > this.maxRepeatingChars) {
        return true;
      }
    }
    
    return false;
  },

  // Check if password is commonly used
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'sunshine', 'superman',
      'football', 'baseball', 'princess', 'freedom', 'password1',
      '12345678', '1234567890', 'qwerty123', 'welcome123'
    ];

    return commonPasswords.includes(password.toLowerCase());
  },

  // Calculate password strength (0-100)
  calculateStrength(password) {
    let score = 0;
    
    // Length scoring
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

    // Bonus points for variety
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 10;

    // Penalty for common patterns
    if (this.hasSequentialChars(password)) score -= 10;
    if (this.hasExcessiveRepeatingChars(password)) score -= 10;
    if (this.isCommonPassword(password)) score -= 20;

    // Advanced patterns bonus
    if (/[!@#$%^&*(),.?":{}|<>]{2,}/.test(password)) score += 5; // Multiple special chars
    if (/\d{2,}/.test(password)) score += 5; // Multiple numbers
    if (/[A-Z]{2,}/.test(password)) score += 5; // Multiple uppercase

    return Math.max(0, Math.min(100, score));
  },

  // Get strength label
  getStrengthLabel(strength) {
    if (strength < 30) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 70) return 'Fair';
    if (strength < 85) return 'Strong';
    return 'Very Strong';
  },

  // Get strength color
  getStrengthColor(strength) {
    if (strength < 30) return '#f44336'; // Red
    if (strength < 50) return '#ff9800'; // Orange
    if (strength < 70) return '#ffeb3b'; // Yellow
    if (strength < 85) return '#8bc34a'; // Light Green
    return '#4caf50'; // Green
  },

  // Generate suggestions for improvement
  generateSuggestions(password) {
    const suggestions = [];
    const validation = this.validate(password);

    if (validation.isValid) {
      return ['Your password meets all requirements!'];
    }

    if (password.length < this.minLength) {
      suggestions.push(`Make your password at least ${this.minLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      suggestions.push('Add uppercase letters (A-Z)');
    }

    if (!/[a-z]/.test(password)) {
      suggestions.push('Add lowercase letters (a-z)');
    }

    if (!/\d/.test(password)) {
      suggestions.push('Add numbers (0-9)');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Add special characters (!@#$%^&*...)');
    }

    if (this.isCommonPassword(password)) {
      suggestions.push('Avoid common passwords - be more creative!');
    }

    if (this.hasSequentialChars(password)) {
      suggestions.push('Avoid sequential characters like "abc" or "123"');
    }

    if (this.hasExcessiveRepeatingChars(password)) {
      suggestions.push('Avoid repeating the same character multiple times');
    }

    return suggestions;
  },

  // Check if password has been compromised (placeholder for future HIBP integration)
  async checkCompromised(password) {
    // This would integrate with Have I Been Pwned API
    // For now, return false as placeholder
    return false;
  }
};
