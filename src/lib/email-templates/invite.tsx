import * as React from 'react'
import { Button, Hr, Link, Section, Text } from '@react-email/components'
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
  <BrandedLayout
    preview={`You're invited to join ${siteName}`}
    eyebrow="You're invited"
  >
    <Text style={styles.h1}>Join the Fennecly family 🚀</Text>
    <Text style={styles.text}>
      You've been invited to join{' '}
      <Link href={siteUrl} style={styles.link}>
        <strong>{siteName}</strong>
      </Link>
      . Accept your invitation to create your account and start collaborating.
    </Text>

    <Section style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Accept invitation →
      </Button>
    </Section>

    <Section style={styles.callout}>
      🎯 Once you join, you'll have access to all the tools you need to
      manage products, orders, and customers — beautifully.
    </Section>

    <Hr style={styles.divider} />

    <Text style={styles.fallbackLabel}>
      Button not working? Paste this link into your browser:
    </Text>
    <Text style={styles.fallbackUrl}>{confirmationUrl}</Text>

    <Text style={styles.muted}>
      If you weren't expecting this invitation, you can safely ignore this
      email.
    </Text>
  </BrandedLayout>
)

export default InviteEmail
