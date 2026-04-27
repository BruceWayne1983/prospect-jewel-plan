/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brandMark, h1, text, button, footer } from './_shared-styles.ts'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your sign-in link for Jewellery Territory</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandMark}>Jewellery Territory</Text>
        <Heading style={h1}>Your sign-in link</Heading>
        <Text style={text}>
          Click below to sign in. This link expires shortly for your security.
        </Text>
        <Button style={button} href={confirmationUrl}>Sign In</Button>
        <Text style={footer}>If you didn't request this link, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
