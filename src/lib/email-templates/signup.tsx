import * as React from 'react'
import { Button, Link, Text } from '@react-email/components'
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
  <BrandedLayout preview={`Confirm your email for ${siteName}`}>
    <Text style={styles.h1}>Welcome to Fennecly 👋</Text>
    <Text style={styles.text}>
      Thanks for signing up! Please confirm your email address (
      <Link href={`mailto:${recipient}`} style={styles.link}>
        {recipient}
      </Link>
      ) to activate your account and start building your store.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Verify my email
    </Button>
    <Text style={styles.muted}>
      If you didn't create an account, you can safely ignore this email.
    </Text>
  </BrandedLayout>
)

export default SignupEmail
