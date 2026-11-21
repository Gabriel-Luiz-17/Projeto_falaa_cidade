import { Coordenadas } from "@/context/cidade-context";
import { buscarOcorrencias } from "@/services/ocorrencias";
import { Ocorrencia, StatusOcorrencia } from "@/types/ocorrencia";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** Carrega as ocorrências do Firestore sempre que a tela volta a ficar em foco. */
export function useOcorrencias(coordenadas: Coordenadas | null) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(false);
  // Estado usado para forçar uma nova busca (ex.: puxar para atualizar na lista).
  const [atualizacao, setAtualizacao] = useState(0);

  // Função exposta para permitir recarregar manualmente quando necessário.
  const recarregar = useCallback(() => {
    setAtualizacao((valor) => valor + 1);
  }, []);

  const aplicarStatusLocalmente = useCallback((id: string, status: StatusOcorrencia) => {
    setOcorrencias((lista) =>
      lista.map((ocorrencia) =>
        ocorrencia.id === id ? { ...ocorrencia, status } : ocorrencia
      )
    );
  }, []);

  // useFocusEffect executa a busca quando a tela recebe foco.
  // Assim, ao voltar da tela de "Novo reporte", a lista/mapa são atualizados automaticamente.
  // useCallback evita recriar a função a cada renderização sem necessidade.
  useFocusEffect(
    useCallback(() => {
      if (!coordenadas) {
        setOcorrencias([]);
        setCarregando(false);
        return;
      }

      let ativo = true; // evita atualizar o estado depois que a tela foi desmontada
      setCarregando(true);

      buscarOcorrencias(coordenadas)
        .then((lista) => {
          if (ativo) {
            setOcorrencias(lista);
          }
        })
        .catch((erro) => {
          // Tratamento de erro para não deixar Promise sem tratamento.
          console.warn("Erro ao buscar ocorrências no Firestore", erro);
          if (ativo) {
            setOcorrencias([]);
          }
        })
        .finally(() => {
          if (ativo) {
            setCarregando(false);
          }
        });

      return () => {
        ativo = false;
      };
    }, [coordenadas, atualizacao])
  );

  return { ocorrencias, carregando, recarregar, aplicarStatusLocalmente };
}