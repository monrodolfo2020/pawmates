import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { IconButton } from '../components/Button';
import LegalText from '../components/LegalText';
import { colors, fonts, space } from '../theme/tokens';
import { LegalDocumentType } from '../api/client';
import { privacyNotice } from '../legal/privacyNotice';
import { ownerTerms } from '../legal/ownerTerms';
import { providerAgreement } from '../legal/providerAgreement';

type Props = NativeStackScreenProps<RootStackParamList, 'LegalDocument'>;

const READING_MAX_WIDTH = 720;

/** The consent for the identity photos is short and belongs next to the
 * upload, so it lives here as its own text rather than as a document in
 * docs/legal. It mirrors section 4 of the privacy notice. */
const identityConsent = `# Consentimiento para la verificación de identidad

La verificación de identidad es **opcional**.

Si decides continuar, nos entregas una fotografía de tu rostro y una de
tu documento oficial de identificación. Una persona de nuestro equipo las
revisará visualmente para confirmar que corresponden a la misma persona.

**No las publicamos, no las usamos para reconocimiento facial
automatizado y no las compartimos con otros usuarios.** Se guardan en
almacenamiento privado y solo pueden consultarse mediante enlaces
firmados de corta duración.

Lo único que obtienes al superar la verificación es que se muestre una
insignia de "Identidad verificada" en tu página y en el directorio. Tu
página se publica igual sin ella.

Puedes retirar tu consentimiento cuando quieras. Al hacerlo eliminaremos
las imágenes y se retirará la insignia.

Esto corresponde a la sección 4 del Aviso de Privacidad.`;

const TEXTS: Record<LegalDocumentType, { title: string; body: string }> = {
  privacy_notice: { title: 'Aviso de Privacidad', body: privacyNotice },
  owner_terms: { title: 'Términos y Condiciones', body: ownerTerms },
  provider_agreement: { title: 'Acuerdo de Prestadores', body: providerAgreement },
  identity_verification_consent: {
    title: 'Verificación de identidad',
    body: identityConsent,
  },
};

/**
 * Shows one legal document. The texts are bundled with the app rather
 * than fetched, so they open instantly and work offline — someone
 * deciding whether to accept should never be waiting on the network.
 */
export default function LegalDocumentScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const document = TEXTS[route.params.type];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <IconButton onPress={() => navigation.goBack()}>
            <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
          </IconButton>
        ) : (
          Platform.OS === 'web' && (
            // Opened from its own public link: the way out is the app.
            <IconButton onPress={() => window.location.assign('/')}>
              <ChevronLeft size={18} strokeWidth={1.5} color={colors.text} />
            </IconButton>
          )
        )}
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: Math.min(width, READING_MAX_WIDTH) }}>
          {/* The header already names the document. */}
          <LegalText markdown={document.body.replace(/^# .*\n+/, '')} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.s3, paddingVertical: space.s2,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
  },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 19, color: colors.text },
  scroll: { alignItems: 'center', paddingHorizontal: space.s4, paddingBottom: space.s8 },
});
