import * as React from 'react'
import { Button, Hr, Link, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <BrandedLayout
    preview={`Confirm your new email for ${siteName}`}
    eyebrow="Email change"
  >
    <Text style={styles.h1}>Confirm your new email 📬</Text>
    <Text style={styles.text}>
      You requested to change the email on your {siteName} account from{' '}
      <Link href={`mailto:${email}`} style={styles.link}>
        {email}
      </Link>{' '}
      to{' '}
      <Link href={`mailto:${newEmail}`} style={styles.link}>
        {newEmail}
      </Link>
      . Click below to confirm this change.
    </Text>

    <Section style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Confirm email change →
      </Button>
    </Section>

    <Section style={styles.callout}>
      ⚠️ <strong>Didn't request this?</strong> Your account may be at risk —
      please reset your password and contact our support team immediately.
    </Section>

    <Hr style={styles.divider} />

    <Text style={styles.fallbackLabel}>
      Button not working? Paste this link into your browser:
    </Text>
    <Text style={styles.fallbackUrl}>{confirmationUrl}</Text>
  </BrandedLayout>
)

export default EmailChangeEmail
