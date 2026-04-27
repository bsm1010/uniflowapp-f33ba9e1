import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const LOGO_URL =
  'https://gyfcaoscsjazazhfozig.supabase.co/storage/v1/object/public/store-assets/email/fennecly-logo.webp'
const SUPPORT_URL = 'https://fennecly.online/contact'
const SITE_URL = 'https://fennecly.online'

interface BrandedLayoutProps {
  preview: string
  children: React.ReactNode
}

export const BrandedLayout = ({ preview, children }: BrandedLayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Gradient header band */}
        <Section style={headerBand}>
          <Img
            src={LOGO_URL}
            alt="Fennecly"
            width="140"
            height="40"
            style={logo}
          />
        </Section>

        {/* Content card */}
        <Section style={card}>{children}</Section>

        {/* Footer */}
        <Section style={footer}>
          <Hr style={hr} />
          <Text style={footerText}>
            Need help?{' '}
            <Link href={SUPPORT_URL} style={footerLink}>
              Contact our support team
            </Link>
          </Text>
          <Text style={footerSmall}>
            © {new Date().getFullYear()} Fennecly · Built for Algerian
            e-commerce ·{' '}
            <Link href={SITE_URL} style={footerLink}>
              fennecly.online
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Brand tokens (hex equivalents of oklch values from styles.css)
export const brand = {
  primary: '#6D28D9', // violet 700 — matches --primary
  glow: '#A855F7', // violet glow — matches --brand-glow
  text: '#1E1B2E',
  muted: '#6B6280',
  border: '#E9E4F2',
  bg: '#F7F5FB',
  cardBg: '#FFFFFF',
  white: '#FFFFFF',
}

const main = {
  backgroundColor: brand.bg,
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: '32px 0',
}

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 16px',
}

const headerBand = {
  background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.glow} 100%)`,
  borderRadius: '16px 16px 0 0',
  padding: '28px 32px',
  textAlign: 'center' as const,
}

const logo = {
  display: 'inline-block',
  height: '40px',
  width: 'auto',
}

const card = {
  backgroundColor: brand.cardBg,
  borderRadius: '0 0 16px 16px',
  padding: '36px 32px',
  borderLeft: `1px solid ${brand.border}`,
  borderRight: `1px solid ${brand.border}`,
  borderBottom: `1px solid ${brand.border}`,
}

const footer = {
  padding: '24px 32px 8px',
  textAlign: 'center' as const,
}

const hr = {
  border: 'none',
  borderTop: `1px solid ${brand.border}`,
  margin: '0 0 20px',
}

const footerText = {
  fontSize: '13px',
  color: brand.muted,
  margin: '0 0 8px',
  lineHeight: '1.5',
}

const footerSmall = {
  fontSize: '12px',
  color: brand.muted,
  margin: '0',
  lineHeight: '1.5',
}

const footerLink = {
  color: brand.primary,
  textDecoration: 'underline',
  fontWeight: 500,
}

// Shared content styles for use inside templates
export const styles = {
  h1: {
    fontFamily: '"Space Grotesk", "Inter", sans-serif',
    fontSize: '26px',
    fontWeight: 700 as const,
    color: brand.text,
    margin: '0 0 16px',
    lineHeight: '1.25',
    letterSpacing: '-0.01em',
  },
  text: {
    fontSize: '15px',
    color: brand.text,
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  muted: {
    fontSize: '13px',
    color: brand.muted,
    lineHeight: '1.5',
    margin: '24px 0 0',
  },
  link: {
    color: brand.primary,
    textDecoration: 'underline',
    fontWeight: 500 as const,
  },
  button: {
    display: 'inline-block',
    background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.glow} 100%)`,
    color: brand.white,
    fontSize: '15px',
    fontWeight: 600 as const,
    borderRadius: '12px',
    padding: '14px 28px',
    textDecoration: 'none',
    margin: '8px 0 16px',
    boxShadow: '0 4px 14px rgba(109, 40, 217, 0.25)',
  },
  code: {
    display: 'inline-block',
    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
    fontSize: '28px',
    fontWeight: 700 as const,
    color: brand.primary,
    backgroundColor: brand.bg,
    border: `1px solid ${brand.border}`,
    borderRadius: '12px',
    padding: '16px 24px',
    letterSpacing: '0.2em',
    margin: '8px 0 16px',
  },
}
