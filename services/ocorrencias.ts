import { Coordenadas } from "@/context/cidade-context";
import { bancoDeDados } from "@/firebase-config";
import { Ocorrencia } from "@/types/ocorrencia";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

/**
 * Busca no Firestore os últimos reportes da coleção "ocorrencias".
 * O parâmetro _centro é mantido para compatibilidade com o restante do app.
 * Retorna os dados reais do banco (sem coordenadas fictícias).
 */
export async function buscarOcorrencias(_centro: Coordenadas): Promise<Ocorrencia[]> {
  // Monta a consulta na coleção "ocorrencias".
  // orderBy("criadoEm", "desc") ordena do mais novo para o mais antigo.
  // limit(50) restringe o resultado aos 50 documentos mais recentes.
  const consulta = query(
    collection(bancoDeDados, "ocorrencias"),
    orderBy("criadoEm", "desc"),
    limit(50)
  );

  // getDocs executa a consulta e busca os documentos no Firestore.
  const resultado = await getDocs(consulta);

  // Converte cada documento do Firestore para o tipo Ocorrencia usado pelo app.
  // O id real do documento é preservado (doc.id), não usamos ids inventados.
  return resultado.docs.map((documento) => {
    const dados = documento.data();
    return {
      id: documento.id,
      titulo: dados.titulo ?? "",
      descricao: dados.descricao ?? null,
      status: dados.status ?? "aberto",
      latitude: Number(dados.latitude),
      longitude: Number(dados.longitude),
      idNotificante: dados.idNotificante,
      tipo: dados.tipo,
      endereco: dados.endereco ?? null,
      criadoEm: dados.criadoEm, // Timestamp do Firestore (pode ser usado para exibir data)
    };
  });
}
