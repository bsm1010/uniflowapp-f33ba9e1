import * as React from 'react'
import { Button, Hr, Link, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <BrandedLayout
    preview={`Confirm your email and start selling on ${siteName}`}
    eyebrow="Welcome aboard"
  >
    <Text style={styles.h1}>Confirm your email to get started 🎉</Text>
    <Text style={styles.text}>
      Hi! Thanks for signing up for <strong>Fennecly</strong>. Please confirm
      that{' '}
      <Link href={`mailto:${recipient}`} style={styles.link}>
        {recipient}
      </Link>{' '}
      is your email so we can activate your account and get your store ready.
    </Text>

    <Section style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Verify my email →
      </Button>
    </Section>

    <Section style={styles.callout}>
      ✨ Once verified, you'll get instant access to product management,
      delivery integrations (Yalidine, ZR Express), AI tools, and your
      branded online storefront.
    </Section>

    <Hr style={styles.divider} />

    <Text style={styles.fallbackLabel}>
      Button not working? Paste this link into your browser:
    </Text>
    <Text style={styles.fallbackUrl}>{confirmationUrl}</Text>

    <Text style={styles.muted}>
      If you didn't create a Fennecly account, you can safely ignore this
      email.
    </Text>
  </BrandedLayout>
)

export default SignupEmail
