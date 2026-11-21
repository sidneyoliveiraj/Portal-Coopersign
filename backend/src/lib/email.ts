export type Email = { para: string; assunto: string; texto: string };

// Ainda sem servidor de e-mail: o link aparece no terminal do backend.
// No deploy, este e o unico ponto a trocar para enviar de verdade.
export async function enviarEmail(email: Email) {
  console.log(`[e-mail para ${email.para}] ${email.assunto}\n${email.texto}`);
}
