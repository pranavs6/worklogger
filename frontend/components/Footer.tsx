'use client'

import { useTheme } from './ThemeProvider'

export default function Footer() {
  const { theme, toggleTheme } = useTheme()

  return (
    <footer className="govuk-footer">
      <div className="govuk-footer__container">
        <div className="govuk-footer__copyright">
          © 2024 Work Logger. Professional work logging system.
        </div>
        <div className="govuk-footer__links">
          <a href="#" className="govuk-footer__link">
            Privacy Policy
          </a>
          <a href="#" className="govuk-footer__link">
            Terms of Service
          </a>
          <a href="#" className="govuk-footer__link">
            Support
          </a>
          <button
            onClick={toggleTheme}
            className="govuk-footer__link theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>
    </footer>
  )
}