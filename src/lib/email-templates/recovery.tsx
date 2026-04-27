import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <BrandedLayout preview={`Reset your password for ${siteName}`}>
    <Text style={styles.h1}>Reset your password</Text>
    <Text style={styles.text}>
      We received a request to reset your password for {siteName}. Click the
      button below to choose a new one.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Reset password
    </Button>
    <Text style={styles.muted}>
      If you didn't request a password reset, you can safely ignore this
      email — your password will not be changed.
    </Text>
  </BrandedLayout>
)

export default RecoveryEmail
