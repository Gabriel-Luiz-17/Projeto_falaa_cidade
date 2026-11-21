import { OPCOES_STATUS } from "@/constants/status";
import { bancoDeDados } from "@/firebase-config";
import { StatusOcorrencia } from "@/types/ocorrencia";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

export type DadosDoReporte = {
  id?: string;
  idNotificante: string;
  titulo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  tipo: string;
  endereco?: string;
};

// O ID é reservado pelo SDK do Firestore e gravado com setDoc; assim o app já
// conhece o ID do reporte antes de salvar o documento.
export function gerarIdReporte(): string {
  return doc(collection(bancoDeDados, "ocorrencias")).id;
}

export async function criarReporte(dados: DadosDoReporte): Promise<string> {
  if (!dados.idNotificante || !dados.titulo.trim()) {
    throw new Error("Dados obrigatórios do reporte não informados.");
  }

  const id = dados.id ?? gerarIdReporte();

  await setDoc(doc(bancoDeDados, "ocorrencias", id), {
    idNotificante: dados.idNotificante,
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim() || null,
    status: "aberto",
    latitude: dados.latitude,
    longitude: dados.longitude,
    tipo: dados.tipo,
    endereco: dados.endereco?.trim() || null,
    criadoEm: serverTimestamp(),
  });

  return id;
}

// Esta função só valida o valor do status. A permissão de administrador é
// verificada no cliente pela tela e, de forma definitiva, pelas regras do Firestore.
export async function atualizarStatusReporte(
  id: string,
  status: StatusOcorrencia
): Promise<void> {
  if (!id || !OPCOES_STATUS.includes(status)) {
    throw new Error("Status inválido.");
  }

  await updateDoc(doc(bancoDeDados, "ocorrencias", id), { status });
}
