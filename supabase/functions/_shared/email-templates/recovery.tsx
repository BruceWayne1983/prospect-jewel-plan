/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brandMark, h1, text, button, footer } from './_shared-styles.ts'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for Jewellery Territory</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandMark}>Jewellery Territory</Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password. Click below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>Reset Password</Button>
        <Text style={footer}>
          If you didn't request a reset, you can safely ignore this email — your password will not change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
