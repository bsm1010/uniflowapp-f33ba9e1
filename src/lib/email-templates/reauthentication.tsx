import * as React from 'react'
import { Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <BrandedLayout preview="Your Fennecly verification code">
    <Text style={styles.h1}>Confirm it's you</Text>
    <Text style={styles.text}>
      Use the code below to confirm your identity and continue:
    </Text>
    <Text style={styles.code}>{token}</Text>
    <Text style={styles.muted}>
      This code will expire shortly. If you didn't request this, you can
      safely ignore this email.
    </Text>
  </BrandedLayout>
)

export default ReauthenticationEmail
