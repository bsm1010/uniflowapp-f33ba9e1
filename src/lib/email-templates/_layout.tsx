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
  'https://gyfcaoscsjazazhfozig.supabase.co/storage/v1/object/public/store-assets/email/fennecly-logo-white.png'
const SUPPORT_URL = 'https://fennecly.online/contact'
const SITE_URL = 'https://fennecly.online'

interface BrandedLayoutProps {
  preview: string
  /** Optional small eyebrow label shown above the H1 inside the card */
  eyebrow?: string
  children: React.ReactNode
}

export const BrandedLayout = ({
  preview,
  eyebrow,
  children,
}: BrandedLayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      {/* Outer wrapper for background color */}
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={outerTable}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: '40px 16px' }}>
              <Container style={container}>
                {/* Hero gradient header */}
                <Section style={hero}>
                  <Img
                    src={LOGO_URL}
                    alt="Fennecly"
                    width="48"
                    height="48"
                    style={logoMark}
                  />
                  <Text style={heroBrand}>Fennecly</Text>
                  <Text style={heroTagline}>
                    The all-in-one e-commerce platform for Algeria
                  </Text>
                </Section>

                {/* Content card */}
                <Section style={card}>
                  {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
                  {children}
                </Section>

                {/* Decorative gradient strip */}
                <div style={gradientStrip} />

                {/* Footer */}
                <Section style={footer}>
                  <Text style={footerHelp}>
                    Need a hand?{' '}
                    <Link href={SUPPORT_URL} style={footerLink}>
                      Talk to our support team
                    </Link>
                  </Text>

                  <Hr style={hr} />

                  <Text style={footerCopy}>
                    © {new Date().getFullYear()} Fennecly · Built with ♥ for
                    Algerian merchants
                  </Text>
                  <Text style={footerLinks}>
                    <Link href={SITE_URL} style={footerSmallLink}>
                      Website
                    </Link>
                    <span style={footerDot}>·</span>
                    <Link href={SUPPORT_URL} style={footerSmallLink}>
                      Support
                    </Link>
                    <span style={footerDot}>·</span>
                    <Link
                      href={`${SITE_URL}/privacy`}
                      style={footerSmallLink}
                    >
                      Privacy
                    </Link>
                  </Text>
                </Section>
              </Container>
            </td>
          </tr>
        </tbody>
      </table>
    </Body>
  </Html>
)

// ─── Brand tokens ─────────────────────────────────────────────────────────
export const brand = {
  primary: '#6D28D9',
  primaryDark: '#5B21B6',
  glow: '#A855F7',
  pink: '#EC4899',
  text: '#1A1530',
  textSoft: '#3F3760',
  muted: '#7A7196',
  mutedSoft: '#A39CB8',
  border: '#EDE9F5',
  borderSoft: '#F4F1FA',
  bg: '#F5F2FB',
  cardBg: '#FFFFFF',
  white: '#FFFFFF',
  callout: '#F8F5FE',
}

const main = {
  backgroundColor: brand.bg,
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
  WebkitFontSmoothing: 'antialiased' as const,
}

const outerTable = {
  backgroundColor: brand.bg,
  width: '100%',
}

const container = {
  width: '100%',
  maxWidth: '580px',
  margin: '0 auto',
}

// ─── Hero ────────────────────────────────────────────────────────────────
const hero = {
  background: `linear-gradient(135deg, ${brand.primaryDark} 0%, ${brand.primary} 50%, ${brand.glow} 100%)`,
  borderRadius: '20px 20px 0 0',
  padding: '40px 32px 36px',
  textAlign: 'center' as const,
}

const logoMark = {
  display: 'inline-block',
  width: '48px',
  height: '48px',
  margin: '0 auto 16px',
}

const heroBrand = {
  fontFamily: '"Space Grotesk", "Inter", sans-serif',
  fontSize: '24px',
  fontWeight: 700 as const,
  color: brand.white,
  margin: '0 0 6px',
  letterSpacing: '-0.02em',
  lineHeight: '1.2',
}

const heroTagline = {
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.85)',
  margin: '0',
  fontWeight: 500 as const,
  letterSpacing: '0.01em',
}

// ─── Card ────────────────────────────────────────────────────────────────
const card = {
  backgroundColor: brand.cardBg,
  padding: '40px 36px 36px',
  borderLeft: `1px solid ${brand.border}`,
  borderRight: `1px solid ${brand.border}`,
}

const eyebrowStyle = {
  fontSize: '11px',
  fontWeight: 700 as const,
  color: brand.primary,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  margin: '0 0 12px',
}

// ─── Decorative strip ────────────────────────────────────────────────────
const gradientStrip = {
  height: '4px',
  background: `linear-gradient(90deg, ${brand.primaryDark} 0%, ${brand.primary} 35%, ${brand.glow} 70%, ${brand.pink} 100%)`,
  borderRadius: '0 0 20px 20px',
}

// ─── Footer ──────────────────────────────────────────────────────────────
const footer = {
  padding: '28px 32px 8px',
  textAlign: 'center' as const,
}

const footerHelp = {
  fontSize: '14px',
  color: brand.textSoft,
  margin: '0 0 20px',
  lineHeight: '1.5',
  fontWeight: 500 as const,
}

const hr = {
  border: 'none',
  borderTop: `1px solid ${brand.border}`,
  margin: '0 0 20px',
}

const footerCopy = {
  fontSize: '12px',
  color: brand.muted,
  margin: '0 0 10px',
  lineHeight: '1.5',
}

const footerLinks = {
  fontSize: '12px',
  color: brand.muted,
  margin: '0',
  lineHeight: '1.5',
}

const footerLink = {
  color: brand.primary,
  textDecoration: 'underline',
  fontWeight: 600 as const,
}

const footerSmallLink = {
  color: brand.muted,
  textDecoration: 'none',
  fontWeight: 500 as const,
}

const footerDot = {
  color: brand.mutedSoft,
  margin: '0 8px',
}

// ─── Shared content styles ──────────────────────────────────────────────
export const styles = {
  h1: {
    fontFamily: '"Space Grotesk", "Inter", sans-serif',
    fontSize: '28px',
    fontWeight: 700 as const,
    color: brand.text,
    margin: '0 0 16px',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  text: {
    fontSize: '15px',
    color: brand.textSoft,
    lineHeight: '1.65',
    margin: '0 0 24px',
  },
  muted: {
    fontSize: '13px',
    color: brand.muted,
    lineHeight: '1.6',
    margin: '28px 0 0',
  },
  link: {
    color: brand.primary,
    textDecoration: 'underline',
    fontWeight: 600 as const,
  },
  button: {
    display: 'inline-block',
    background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.glow} 100%)`,
    color: brand.white,
    fontSize: '15px',
    fontWeight: 600 as const,
    borderRadius: '12px',
    padding: '15px 32px',
    textDecoration: 'none',
    margin: '4px 0 8px',
    boxShadow: '0 6px 20px rgba(109, 40, 217, 0.32)',
    letterSpacing: '0.01em',
  },
  buttonWrap: {
    textAlign: 'center' as const,
    margin: '8px 0 16px',
  },
  code: {
    display: 'inline-block',
    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
    fontSize: '32px',
    fontWeight: 700 as const,
    color: brand.primary,
    backgroundColor: brand.callout,
    border: `2px dashed ${brand.border}`,
    borderRadius: '14px',
    padding: '20px 32px',
    letterSpacing: '0.32em',
    margin: '8px 0 16px',
  },
  codeWrap: {
    textAlign: 'center' as const,
    margin: '8px 0 16px',
  },
  callout: {
    backgroundColor: brand.callout,
    border: `1px solid ${brand.border}`,
    borderRadius: '12px',
    padding: '16px 18px',
    margin: '8px 0 0',
    fontSize: '13px',
    color: brand.textSoft,
    lineHeight: '1.55',
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${brand.borderSoft}`,
    margin: '28px 0',
  },
  fallbackLabel: {
    fontSize: '12px',
    color: brand.muted,
    margin: '20px 0 6px',
    fontWeight: 600 as const,
  },
  fallbackUrl: {
    fontSize: '12px',
    color: brand.primary,
    wordBreak: 'break-all' as const,
    margin: '0',
    lineHeight: '1.5',
  },
}
