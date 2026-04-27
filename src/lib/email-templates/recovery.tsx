import * as React from 'react'
import { Button, Hr, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <BrandedLayout
    preview={`Reset your ${siteName} password`}
    eyebrow="Password reset"
  >
    <Text style={styles.h1}>Let's get you back in 🔐</Text>
    <Text style={styles.text}>
      We received a request to reset the password for your {siteName}{' '}
      account. Click the button below to choose a new one — it only takes a
      minute.
    </Text>

    <Section style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Reset my password →
      </Button>
    </Section>

    <Section style={styles.callout}>
      🛡️ <strong>Tip:</strong> For your security, this link will expire
      shortly. Choose a strong password you don't use anywhere else.
    </Section>

    <Hr style={styles.divider} />

    <Text style={styles.fallbackLabel}>
      Button not working? Paste this link into your browser:
    </Text>
    <Text style={styles.fallbackUrl}>{confirmationUrl}</Text>

    <Text style={styles.muted}>
      If you didn't request a password reset, you can safely ignore this
      email — your password will not be changed.
    </Text>
  </BrandedLayout>
)

export default RecoveryEmail
