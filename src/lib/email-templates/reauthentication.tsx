import * as React from 'react'
import { Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <BrandedLayout
    preview="Your Fennecly verification code"
    eyebrow="Verification code"
  >
    <Text style={styles.h1}>Confirm it's really you 🔒</Text>
    <Text style={styles.text}>
      Enter the verification code below to securely confirm your identity
      and continue:
    </Text>

    <Section style={styles.codeWrap}>
      <Text style={styles.code}>{token}</Text>
    </Section>

    <Section style={styles.callout}>
      ⏱️ This code will expire shortly. Never share it with anyone — Fennecly
      will never ask you for it.
    </Section>

    <Text style={styles.muted}>
      If you didn't request this code, you can safely ignore this email.
    </Text>
  </BrandedLayout>
)

export default ReauthenticationEmail
