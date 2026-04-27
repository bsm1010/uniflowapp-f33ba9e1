import * as React from 'react'
import { Button, Link, Text } from '@react-email/components'
import { BrandedLayout, styles } from './_layout'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <BrandedLayout preview={`You've been invited to join ${siteName}`}>
    <Text style={styles.h1}>You're invited to Fennecly ✨</Text>
    <Text style={styles.text}>
      You've been invited to join{' '}
      <Link href={siteUrl} style={styles.link}>
        <strong>{siteName}</strong>
      </Link>
      . Accept your invitation to create your account and get started.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Accept invitation
    </Button>
    <Text style={styles.muted}>
      If you weren't expecting this invitation, you can safely ignore this
      email.
    </Text>
  </BrandedLayout>
)

export default InviteEmail
