import { OPCOES_STATUS, STATUS } from "@/constants/status";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { useOcorrencias } from "@/hooks/use-ocorrencias";
import { atualizarStatusReporte } from "@/services/reportes";
import { cores } from "@/styles";
import { Ocorrencia, StatusOcorrencia } from "@/types/ocorrencia";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatarData(criadoEm: unknown): string {
  // criadoEm é gravado com serverTimestamp(), então chega como Timestamp do Firestore.
  // O método toDate() converte esse Timestamp em um objeto Date do JavaScript.
  if (criadoEm && typeof criadoEm === "object" && "toDate" in criadoEm) {
    const data = (criadoEm as { toDate: () => Date }).toDate();
    if (data instanceof Date && !Number.isNaN(data.getTime())) {
      return data.toLocaleString("pt-BR");
    }
  }
  return "Data indisponível";
}

export default function ListaDeReportes() {
  const { coordenadas } = useCidade();
  const { user } = useAuth();
  const { ehAdmin, verificando: verificandoAdmin, erro: erroAdmin } = useAdmin();
  const { ocorrencias, carregando, recarregar, aplicarStatusLocalmente } =
    useOcorrencias(coordenadas);

  const [atualizando, setAtualizando] = useState(false);
  const [somenteMeus, setSomenteMeus] = useState(false);
  const [statusAlterandoId, setStatusAlterandoId] = useState<string | null>(null);

  const lista = useMemo(() => {
    if (!somenteMeus || !user) return ocorrencias;
    return ocorrencias.filter((o) => o.idNotificante === user.uid);
  }, [ocorrencias, somenteMeus, user]);

  const aoAtualizar = useCallback(() => {
    setAtualizando(true);
    recarregar();
    setTimeout(() => setAtualizando(false), 800);
  }, [recarregar]);

  async function alterarStatus(item: Ocorrencia, novoStatus: StatusOcorrencia) {
    if (statusAlterandoId) return;
    setStatusAlterandoId(item.id);

    try {
      await atualizarStatusReporte(item.id, novoStatus);
      aplicarStatusLocalmente(item.id, novoStatus);
      Alert.alert("Status atualizado", `Status alterado para ${STATUS[novoStatus].rotulo}.`);
    } catch (erro) {
      console.warn("Erro ao atualizar status", erro);
      Alert.alert(
        "Não foi possível alterar o status",
        "Verifique sua permissão de administrador e tente novamente."
      );
    } finally {
      setStatusAlterandoId(null);
    }
  }

  // O botão e este guarda são apenas de interface: quem autoriza a gravação no
  // Firestore é a regra de update, que exige admins/{uid} com role "admin".
  function abrirOpcoesStatus(item: Ocorrencia) {
    if (!ehAdmin) return;

    Alert.alert("Alterar status", `Status atual: ${STATUS[item.status]?.rotulo ?? "Aberto"}`, [
      ...OPCOES_STATUS.map((opcao) => ({
        text: STATUS[opcao].rotulo,
        onPress: () => {
          void alterarStatus(item, opcao);
        },
      })),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  }

  const renderItem = ({ item }: { item: Ocorrencia }) => {
    const infoStatus = STATUS[item.status] ?? STATUS.aberto;

    return (
      <View style={estilos.cartao}>
        <View style={[estilos.bolinha, { backgroundColor: infoStatus.cor }]} />
        <View style={estilos.textos}>
          <Text style={estilos.tituloDoReporte}>{item.titulo}</Text>
          {item.descricao ? <Text style={estilos.descricao}>{item.descricao}</Text> : null}
          {item.tipo ? <Text style={estilos.linha}>Tipo: {item.tipo}</Text> : null}
          {item.endereco ? <Text style={estilos.linha}>Endereço: {item.endereco}</Text> : null}
          <Text style={estilos.linha}>Status: {infoStatus.rotulo}</Text>
          {ehAdmin ? (
            <Pressable
              onPress={() => abrirOpcoesStatus(item)}
              disabled={statusAlterandoId === item.id}
              style={estilos.botaoStatus}
            >
              <Text style={estilos.textoBotaoStatus}>
                {statusAlterandoId === item.id ? "Atualizando..." : "Alterar status"}
              </Text>
            </Pressable>
          ) : null}
          <Text style={estilos.data}>Criado em: {formatarData(item.criadoEm)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.container} edges={["bottom"]}>
      <Text style={estilos.titulo}>Reportes</Text>
      <Text style={estilos.contador}>
        {carregando ? "Carregando..." : `Total exibido: ${lista.length}`}
      </Text>

      {user && verificandoAdmin ? (
        <Text style={estilos.info}>Verificando permissões...</Text>
      ) : null}
      {user && erroAdmin ? (
        <Text style={estilos.info}>Não foi possível verificar permissões de administrador.</Text>
      ) : null}

      {user ? (
        <View style={estilos.filtros}>
          <Pressable
            onPress={() => setSomenteMeus(false)}
            style={[estilos.filtroBotao, !somenteMeus && estilos.filtroBotaoAtivo]}
          >
            <Text style={[estilos.filtroTexto, !somenteMeus && estilos.filtroTextoAtivo]}>Todos</Text>
          </Pressable>
          <Pressable
            onPress={() => setSomenteMeus(true)}
            style={[estilos.filtroBotao, somenteMeus && estilos.filtroBotaoAtivo]}
          >
            <Text style={[estilos.filtroTexto, somenteMeus && estilos.filtroTextoAtivo]}>Meus reportes</Text>
          </Pressable>
        </View>
      ) : null}

      {carregando && ocorrencias.length === 0 ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={cores.verde} size="large" />
          <Text style={estilos.info}>Carregando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={lista.length === 0 ? estilos.listaVazia : undefined}
          ListEmptyComponent={
            !carregando ? <Text style={estilos.vazio}>Nenhum reporte ainda.</Text> : undefined
          }
          refreshControl={
            <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.verde} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: cores.bgBrancoGelo },
  titulo: { fontSize: 22, fontWeight: "700", color: cores.preto },
  contador: { fontSize: 14, color: cores.cinzaEscuro, marginTop: 4, marginBottom: 10 },
  filtros: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filtroBotao: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.googleBorda,
  },
  filtroBotaoAtivo: { backgroundColor: cores.verde, borderColor: cores.verde },
  filtroTexto: { color: cores.cinzaEscuro, fontWeight: "600" },
  filtroTextoAtivo: { color: cores.branco },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  info: { color: cores.cinzaEscuro, marginBottom: 6 },
  listaVazia: { flexGrow: 1, justifyContent: "center" },
  vazio: { textAlign: "center", color: cores.cinzaEscuro, marginTop: 24 },
  cartao: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bolinha: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  textos: { flex: 1, gap: 2 },
  tituloDoReporte: { fontSize: 16, fontWeight: "700", color: cores.preto },
  descricao: { fontSize: 14, color: cores.cinzaEscuro },
  linha: { fontSize: 13, color: cores.cinzaEscuro },
  data: { fontSize: 12, color: cores.cinzaClaro, marginTop: 4 },
  botaoStatus: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: cores.verde,
  },
  textoBotaoStatus: { color: cores.branco, fontWeight: "700", fontSize: 12 },
});
