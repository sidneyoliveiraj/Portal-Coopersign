import { Request, Response } from "express";

export async function listarUsuariosController(req: Request, res: Response) {
  const usuarios = await req.prisma!.usuario.findMany({
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });

  return res.status(200).json({ usuarios });
}
