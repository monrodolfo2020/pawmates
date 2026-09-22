import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, space } from '../theme/tokens';

/**
 * Renders the legal documents, which are authored as markdown in
 * docs/legal and bundled as plain strings (see scripts/sync-legal-text.mjs).
 *
 * Deliberately not a full markdown engine: these documents use a small,
 * known subset — headings, bold, bullets, numbered clauses, tables and
 * rules — and pulling in a renderer to read a contract nobody will read
 * twice isn't worth the dependency. Anything it doesn't recognise still
 * comes out as readable paragraph text, which for a legal document is
 * the only failure mode that matters.
 */

/** `**bold**` inside a line, kept inline so a clause reads as one
 * sentence rather than as broken fragments. */
function inline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={`${keyPrefix}-${i}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    // Backticked placeholders read better as plain text than as code.
    return <Text key={`${keyPrefix}-${i}`}>{part.replace(/`/g, '')}</Text>;
  });
}

export default function LegalText({ markdown }: { markdown: string }) {
  const blocks = markdown.split('\n\n');

  return (
    <View style={styles.wrap}>
      {blocks.map((raw, index) => {
        const block = raw.trim();
        if (!block) return null;
        const key = `b${index}`;

        if (/^-{3,}$/.test(block)) return <View key={key} style={styles.rule} />;

        if (block.startsWith('# ')) {
          return (
            <Text key={key} style={styles.h1}>
              {block.slice(2)}
            </Text>
          );
        }
        if (block.startsWith('## ')) {
          return (
            <Text key={key} style={styles.h2}>
              {block.slice(3)}
            </Text>
          );
        }
        if (block.startsWith('### ')) {
          return (
            <Text key={key} style={styles.h3}>
              {block.slice(4)}
            </Text>
          );
        }

        // A table would need a real layout to be legible on a phone; the
        // rows read fine as lines, which is what matters here.
        if (block.startsWith('|')) {
          const rows = block
            .split('\n')
            .filter((line) => !/^\|[\s|:-]+\|$/.test(line))
            .map((line) =>
              line
                .split('|')
                .slice(1, -1)
                .map((cell) => cell.trim())
                .filter(Boolean)
                .join(' — '),
            );
          return (
            <View key={key} style={styles.list}>
              {rows.map((row, i) => (
                <Text key={`${key}-r${i}`} style={styles.body}>
                  {inline(row, `${key}-r${i}`)}
                </Text>
              ))}
            </View>
          );
        }

        // A list item usually wraps over several source lines, so items
        // are grouped by where a new bullet starts rather than one per
        // line — otherwise the continuation lines fail the test and the
        // whole block collapses into one run-on paragraph.
        const lines = block.split('\n');
        const startsItem = (line: string) => /^\s*(?:[-*]\s|[a-z0-9]{1,3}[.)]\s)/.test(line);
        if (startsItem(lines[0])) {
          const items: string[] = [];
          for (const line of lines) {
            if (startsItem(line) || items.length === 0) {
              items.push(line.trim());
            } else {
              items[items.length - 1] += ' ' + line.trim();
            }
          }
          return (
            <View key={key} style={styles.list}>
              {items.map((item, i) => {
                // The bullet glyph replaces a leading dash; lettered and
                // numbered markers ("a)", "1.") are part of the clause
                // and stay in the text.
                const text = item.replace(/^[-*]\s+/, '');
                return (
                  <View key={`${key}-l${i}`} style={styles.listRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={[styles.body, styles.listBody]}>
                      {inline(text, `${key}-l${i}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        return (
          <Text key={key} style={styles.body}>
            {inline(block.replace(/\n/g, ' '), key)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.s3 },
  h1: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: space.s2 },
  h2: { fontFamily: fonts.heading, fontSize: 17, color: colors.text, marginTop: space.s3 },
  h3: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text, marginTop: space.s2 },
  body: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.text, opacity: 0.9 },
  bold: { fontFamily: fonts.bodyBold, opacity: 1 },
  list: { gap: 6 },
  listRow: { flexDirection: 'row', gap: space.s2 },
  listBody: { flex: 1 },
  bullet: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.accent },
  rule: { height: 1, backgroundColor: colors.divider, marginVertical: space.s2 },
});
