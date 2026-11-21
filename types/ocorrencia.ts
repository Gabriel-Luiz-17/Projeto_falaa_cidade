export type StatusOcorrencia = "aberto" | "em_execucao" | "resolvido";

export type Ocorrencia = {
  id: string; // id do documento no Firestore (gerado pelo SDK antes do setDoc)
  titulo: string;
  descricao?: string | null;
  status: StatusOcorrencia;
  latitude: number;
  longitude: number;
  idNotificante?: string; // uid do usuário que criou o reporte
  tipo?: string; // tipo da ocorrência (buraco, calçada, iluminação, outro)
  endereco?: string | null; // endereço aproximado obtido pelas coordenadas
  criadoEm?: unknown; // data/hora gerada pelo servidor (Timestamp do Firestore)
};