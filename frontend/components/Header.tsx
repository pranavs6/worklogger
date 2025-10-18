'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Log Entry', href: '/log' },
    { name: 'Events', href: '/events' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Places', href: '/places' },
    { name: 'Export', href: '/export' },
  ]

  return (
    <header className="govuk-header">
      <div className="govuk-header__container">
        <div className="govuk-header__logo">
          <Link href="/" className="govuk-header__link govuk-header__link--homepage">
            <span className="govuk-header__logotype">
              <span className="govuk-header__logotype-text">
                Work Logger
              </span>
            </span>
          </Link>
        </div>
        
        <div className="govuk-header__content">
          <button 
            className="govuk-header__menu-button" 
            aria-controls="navigation"
            aria-label="Show or hide Top Level Navigation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            Menu
            <svg className="govuk-header__menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <nav className={`govuk-header__navigation ${isMenuOpen ? 'govuk-header__navigation--open' : ''}`} aria-label="Top Level Navigation">
            <ul className="govuk-header__navigation-list">
              {navigation.map((item) => (
                <li key={item.name} className="govuk-header__navigation-item">
                  <Link
                    href={item.href}
                    className={`govuk-header__link ${
                      pathname === item.href ? 'govuk-header__link--active' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}