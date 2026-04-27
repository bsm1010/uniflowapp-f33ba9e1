import * as React from 'react'
import { Button, Hr, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <BrandedLayout
    preview={`Your secure login link for ${siteName}`}
    eyebrow="One-click login"
  >
    <Text style={styles.h1}>Your magic link is ready ✨</Text>
    <Text style={styles.text}>
      Click the button below to securely log in to {siteName}. No password
      required — we've got you covered.
    </Text>

    <Section style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Log in to Fennecly →
      </Button>
    </Section>

    <Section style={styles.callout}>
      ⏱️ For your security, this link will expire shortly and can only be
      used once.
    </Section>

    <Hr style={styles.divider} />

    <Text style={styles.fallbackLabel}>
      Button not working? Paste this link into your browser:
    </Text>
    <Text style={styles.fallbackUrl}>{confirmationUrl}</Text>

    <Text style={styles.muted}>
      If you didn't request this login link, you can safely ignore this
      email.
    </Text>
  </BrandedLayout>
)

export default MagicLinkEmail
