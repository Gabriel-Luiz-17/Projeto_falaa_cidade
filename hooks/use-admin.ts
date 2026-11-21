import { useAuth } from "@/hooks/use-auth";
import { verificarAdministrador } from "@/services/administradores";
import { useEffect, useState } from "react";

export function useAdmin() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [ehAdmin, setEhAdmin] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.resolve().then(() => {
      if (!ativo) return;

      if (!uid) {
        setEhAdmin(false);
        setVerificando(false);
        setErro(false);
        return;
      }

      setVerificando(true);
      verificarAdministrador(uid)
        .then((resultado) => {
          if (ativo) {
            setEhAdmin(resultado);
            setErro(false);
          }
        })
        .catch((falha) => {
          console.warn("Erro ao verificar administrador", falha);
          // Se a consulta falhar, o usuário é tratado como não administrador.
          if (ativo) {
            setEhAdmin(false);
            setErro(true);
          }
        })
        .finally(() => {
          if (ativo) setVerificando(false);
        });
    });

    return () => {
      ativo = false;
    };
  }, [uid]);

  return { ehAdmin, verificando, erro };
}
