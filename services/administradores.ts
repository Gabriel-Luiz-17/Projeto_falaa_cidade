import { bancoDeDados } from "@/firebase-config";
import { doc, getDoc } from "firebase/firestore";

// Um usuário é administrador quando existe um documento admins/{uid} com role "admin".
// O UID do usuário autenticado é usado como ID do documento, então basta esta consulta.
export async function verificarAdministrador(uid: string): Promise<boolean> {
  if (!uid) return false;

  const documento = await getDoc(doc(bancoDeDados, "admins", uid));

  return documento.exists() && documento.data()?.role === "admin";
}
