import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Path, renderToBuffer } from '@react-pdf/renderer'

const NAVY = '#161642'
const ACCENT = '#2f6bf2'
const GOLD = '#d4a017'

const s = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { backgroundColor: NAVY, paddingHorizontal: 40, paddingVertical: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 38, height: 38, borderRadius: 8, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandName: { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
  brandUrl: { color: 'rgba(255,255,255,0.45)', fontSize: 9, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  serialLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  serialValue: { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  accentBar: { height: 4, backgroundColor: ACCENT },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60, paddingVertical: 24 },
  certifiesLabel: { color: '#9ca3af', fontSize: 9, letterSpacing: 3, marginBottom: 16 },
  clientName: { color: NAVY, fontSize: 34, fontFamily: 'Helvetica-Bold', marginBottom: 10, textAlign: 'center' },
  goldLine: { height: 3, width: 60, backgroundColor: GOLD, marginBottom: 20 },
  certTitle: { color: NAVY, fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 8, textAlign: 'center' },
  certSubtitle: { color: '#6b7280', fontSize: 10, textAlign: 'center', marginBottom: 24 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  detailBlock: { alignItems: 'center', paddingHorizontal: 24 },
  detailLabel: { color: '#9ca3af', fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  detailValue: { color: NAVY, fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  divider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
  footer: { backgroundColor: NAVY, paddingHorizontal: 40, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { color: 'rgba(255,255,255,0.45)', fontSize: 8 },
  footerRight: { color: 'rgba(255,255,255,0.25)', fontSize: 8 },
})

export interface CertData {
  firstName: string
  lastName: string
  businessName: string
  serialNumber: string
  title: string
  subtitle: string
  footerText: string
}

function CertificateDocument({ firstName, lastName, businessName, serialNumber, title, subtitle, footerText }: CertData) {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const year = new Date().getFullYear()

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="white" />
              </Svg>
            </View>
            <View>
              <Text style={s.brandName}>BUSINESS HUB</Text>
              <Text style={s.brandUrl}>businesshub.com</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.serialLabel}>SERIAL NUMBER</Text>
            <Text style={s.serialValue}>{serialNumber}</Text>
          </View>
        </View>

        <View style={s.accentBar} />

        <View style={s.body}>
          <Text style={s.certifiesLabel}>THIS CERTIFIES THAT</Text>
          <Text style={s.clientName}>{firstName} {lastName}</Text>
          <View style={s.goldLine} />
          <Text style={s.certTitle}>{title}</Text>
          {subtitle ? <Text style={s.certSubtitle}>{subtitle}</Text> : null}

          <View style={s.detailsRow}>
            <View style={s.detailBlock}>
              <Text style={s.detailLabel}>BUSINESS NAME</Text>
              <Text style={s.detailValue}>{businessName}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.detailBlock}>
              <Text style={s.detailLabel}>DATE ISSUED</Text>
              <Text style={s.detailValue}>{dateStr}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerLeft}>{footerText || 'Business Hub — Official Certificate'}</Text>
          <Text style={s.footerRight}>© {year} Business Hub. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateCertificatePdf(data: CertData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...data} />)
}
