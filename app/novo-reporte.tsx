import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { criarReporte, gerarIdReporte } from "@/services/reportes";
import { cores } from "@/styles";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Opções de tipo exibidas como botões simples na tela.
const TIPOS_OCORRENCIA = ["Buraco", "Calçada", "Iluminação", "Outro"] as const;

export default function NovoReporte() {
  const roteador = useRouter();
  // Hook de autenticação: fornece o usuário logado (inclui o uid usado no Firestore).
  const { user: usuario } = useAuth();
  // Hook de localização: fornece as coordenadas atuais obtidas pelo GPS.
  const { coordenadas } = useCidade();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS_OCORRENCIA)[number] | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    // Evita envios duplicados enquanto a requisição está em andamento.
    if (enviando) return;

    // Validações exigidas antes de gravar o reporte.
    if (!titulo.trim()) {
      Alert.alert("Título obrigatório", "Informe um título para o problema.");
      return;
    }
    if (!usuario) {
      Alert.alert("Login necessário", "Entre com sua conta para enviar um reporte.");
      return;
    }
    if (!coordenadas) {
      Alert.alert(
        "Localização indisponível",
        "Ative a localização do aparelho para registrar o local do problema."
      );
      return;
    }

    setEnviando(true);

    try {
      let endereco: string | undefined;
      try {
        const [lugar] = await Location.reverseGeocodeAsync({
          latitude: coordenadas.latitude,
          longitude: coordenadas.longitude,
        });
        if (lugar) {
          const partes = [lugar.street, lugar.streetNumber, lugar.district, lugar.city].filter(Boolean);
          endereco = partes.join(", ") || undefined;
        }
      } catch {
        endereco = undefined;
      }

      const idReporte = gerarIdReporte();

      await criarReporte({
        id: idReporte,
        idNotificante: usuario.uid,
        titulo,
        descricao,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
        tipo: tipo ?? "Outro",
        endereco,
      });

      Alert.alert("Reporte enviado", "Obrigado por ajudar a cidade!", [
        { text: "Ver mapa", onPress: () => roteador.back() },
      ]);
      setTitulo("");
      setDescricao("");
      setTipo(null);
    } catch (erro) {
      console.warn("Falha ao gravar o reporte", erro);
      Alert.alert(
        "Não foi possível enviar",
        erro instanceof Error ? erro.message : "Tente novamente em instantes."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>Novo reporte</Text>
          <Text style={styles.subtitulo}>Informe os detalhes do problema encontrado na cidade.</Text>

          <Text style={styles.rotulo}>Título *</Text>
          <TextInput
            style={styles.campo}
            placeholder="Ex.: Buraco na Rua das Palmeiras"
            placeholderTextColor={cores.cinzaClaro}
            value={titulo}
            onChangeText={setTitulo}
            editable={!enviando}
          />

          <Text style={styles.rotulo}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.campo, styles.campoGrande]}
            placeholder="Descreva o problema com mais detalhes"
            placeholderTextColor={cores.cinzaClaro}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            textAlignVertical="top"
            editable={!enviando}
          />

          <Text style={styles.rotulo}>Tipo de ocorrência</Text>
          <View style={styles.tipos}>
            {TIPOS_OCORRENCIA.map((opcao) => {
              const selecionado = tipo === opcao;
              return (
                <Pressable
                  key={opcao}
                  onPress={() => setTipo(opcao)}
                  disabled={enviando}
                  style={[styles.tipoBotao, selecionado && styles.tipoBotaoAtivo]}
                >
                  <Text style={[styles.tipoTexto, selecionado && styles.tipoTextoAtivo]}>{opcao}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.botaoEnviar,
              (enviando || pressed) && styles.botaoEnviarPressionado,
            ]}
            onPress={enviar}
            disabled={enviando}
          >
            {enviando ? (
              <View style={styles.linhaBotao}>
                <ActivityIndicator color={cores.branco} />
                <Text style={styles.textoBotao}>Enviando...</Text>
              </View>
            ) : (
              <Text style={styles.textoBotao}>Enviar reporte</Text>
            )}
          </Pressable>

          <Pressable onPress={() => roteador.back()} disabled={enviando}>
            <Text style={styles.cancelar}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bgBrancoGelo },
  flex: { flex: 1 },
  conteudo: { padding: 20, gap: 10 },
  titulo: { fontSize: 24, fontWeight: "700", color: cores.preto },
  subtitulo: { fontSize: 14, color: cores.cinzaEscuro, marginBottom: 6 },
  rotulo: { fontSize: 14, fontWeight: "600", color: cores.preto, marginTop: 6 },
  campo: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: cores.preto,
    borderWidth: 1,
    borderColor: cores.googleBorda,
  },
  campoGrande: { minHeight: 110 },
  tipos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tipoBotao: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.googleBorda,
  },
  tipoBotaoAtivo: { backgroundColor: cores.verde, borderColor: cores.verde },
  tipoTexto: { color: cores.cinzaEscuro, fontWeight: "600" },
  tipoTextoAtivo: { color: cores.branco },
  botaoEnviar: {
    backgroundColor: cores.verde,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  botaoEnviarPressionado: { opacity: 0.85 },
  textoBotao: { color: cores.branco, fontWeight: "700", fontSize: 16 },
  linhaBotao: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelar: { textAlign: "center", color: cores.cinzaEscuro, padding: 10, fontWeight: "600" },
});
