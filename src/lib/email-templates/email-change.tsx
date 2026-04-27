import * as React from 'react'
import { Button, Link, Text } from '@react-email/components'
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
  <BrandedLayout preview={`Confirm your email change for ${siteName}`}>
    <Text style={styles.h1}>Confirm your new email</Text>
    <Text style={styles.text}>
      You requested to change the email on your {siteName} account from{' '}
      <Link href={`mailto:${email}`} style={styles.link}>
        {email}
      </Link>{' '}
      to{' '}
      <Link href={`mailto:${newEmail}`} style={styles.link}>
        {newEmail}
      </Link>
      .
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Confirm email change
    </Button>
    <Text style={styles.muted}>
      If you didn't request this change, please secure your account
      immediately and contact our support team.
    </Text>
  </BrandedLayout>
)

export default EmailChangeEmail
