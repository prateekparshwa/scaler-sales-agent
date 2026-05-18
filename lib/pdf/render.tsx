import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import React from "react";
import { LeadProfile, PdfContent } from "../types";

// Use built-in Helvetica family — no Font.register network call, keeps cold start fast.
// (react-pdf bundles Helvetica/Times/Courier by default.)

function makeStyles(accent: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 56,
      paddingBottom: 56,
      paddingHorizontal: 56,
      fontFamily: "Helvetica",
      fontSize: 11,
      lineHeight: 1.55,
      color: "#0F172A",
    },
    headerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
    },
    brand: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 2,
      color: accent,
    },
    program: {
      fontSize: 9,
      color: "#64748B",
    },
    accentRule: {
      height: 3,
      width: 48,
      backgroundColor: accent,
      marginBottom: 18,
    },
    greeting: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      marginBottom: 14,
      color: "#0F172A",
    },
    hook: {
      fontSize: 11,
      color: "#1E293B",
      marginBottom: 24,
    },
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 12.5,
      fontFamily: "Helvetica-Bold",
      marginBottom: 6,
      color: accent,
    },
    sectionBody: {
      fontSize: 10.5,
      color: "#1E293B",
    },
    citation: {
      fontSize: 8,
      color: "#94A3B8",
      marginTop: 3,
      fontStyle: "italic",
    },
    closingBlock: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: `1px solid #E2E8F0`,
    },
    closingNote: {
      fontSize: 10.5,
      color: "#0F172A",
      marginBottom: 10,
    },
    ctaBox: {
      backgroundColor: accent,
      padding: 12,
      borderRadius: 4,
    },
    ctaText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 56,
      right: 56,
      fontSize: 8,
      color: "#94A3B8",
      textAlign: "center",
    },
  });
}

interface DocProps {
  profile: LeadProfile;
  content: PdfContent;
}

function LeadDoc({ profile, content }: DocProps) {
  const styles = makeStyles(content.accentColor || "#0EA5E9");
  const firstName = profile.name.split(" ")[0];

  return (
    <Document
      title={`A note for ${firstName} — ${content.programReference}`}
      author="Scaler"
      subject={`Personalised note for ${profile.name}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.brand}>SCALER</Text>
          <Text style={styles.program}>{content.programReference}</Text>
        </View>

        <View style={styles.accentRule} />

        <Text style={styles.greeting}>{content.greeting}</Text>
        <Text style={styles.hook}>{content.hook}</Text>

        {content.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
            {s.citation && s.citation.startsWith("http") ? (
              <Text style={styles.citation}>Source: {s.citation}</Text>
            ) : null}
          </View>
        ))}

        <View style={styles.closingBlock}>
          <Text style={styles.closingNote}>{content.closingNote}</Text>
          <View style={styles.ctaBox}>
            <Text style={styles.ctaText}>{content.cta}</Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Personalised for ${profile.name} • ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function renderLeadPdf(
  profile: LeadProfile,
  content: PdfContent
): Promise<Buffer> {
  return renderToBuffer(<LeadDoc profile={profile} content={content} />);
}
