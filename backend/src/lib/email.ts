import nodemailer from "nodemailer";

export type Email = { para: string; assunto: string; texto: string };

// Em producao o envio sai pelo SMTP configurado no ambiente.
// Sem SMTP_HOST (desenvolvimento), o link aparece no terminal do backend.
export function criarTransporte() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_SENHA },
  });
}

export async function enviarEmail(email: Email) {
  const transporte = criarTransporte();
  if (!transporte) {
    console.log(`[e-mail para ${email.para}] ${email.assunto}\n${email.texto}`);
    return;
  }
  await transporte.sendMail({
    from: process.env.SMTP_REMETENTE ?? process.env.SMTP_USUARIO,
    to: email.para,
    subject: email.assunto,
    text: email.texto,
  });
}
