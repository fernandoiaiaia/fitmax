//@ts-nocheck
import { redirect } from "next/navigation";

export default function PainelIndex() {
  // Redireciona o acesso a /painel diretamente para a primeira rota disponível (Consultas)
  redirect("/painel/consultas");
}
