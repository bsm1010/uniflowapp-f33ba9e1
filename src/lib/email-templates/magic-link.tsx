import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <BrandedLayout preview={`Your login link for ${siteName}`}>
    <Text style={styles.h1}>Your secure login link</Text>
    <Text style={styles.text}>
      Click the button below to log in to {siteName}. This link will expire
      shortly for your security.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Log in to Fennecly
    </Button>
    <Text style={styles.muted}>
      If you didn't request this link, you can safely ignore this email.
    </Text>
  </BrandedLayout>
)

export default MagicLinkEmail
