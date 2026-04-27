/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brandMark, h1, text, link, button, footer } from './_shared-styles.ts'

interface SignupEmailProps { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for Jewellery Territory</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandMark}>Jewellery Territory</Text>
        <Heading style={h1}>Welcome — please confirm your email</Heading>
        <Text style={text}>
          Thank you for joining <Link href={siteUrl} style={link}>Jewellery Territory</Link>.
        </Text>
        <Text style={text}>
          Please confirm <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> to activate your account:
        </Text>
        <Button style={button} href={confirmationUrl}>Confirm Email</Button>
        <Text style={footer}>If you didn't create this account, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
