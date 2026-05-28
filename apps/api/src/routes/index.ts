import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { professionalRouter } from '../modules/professional/professional.routes';
import { clientRouter } from '../modules/client/client.routes';
import consultasRouter from '../modules/consultas/consultas.routes';
import publicacoesRouter from '../modules/publicacoes/publicacoes.routes';
import usuariosRouter from '../modules/usuarios/usuarios.routes';
import relatoriosRouter from '../modules/relatorios/relatorios.routes';
import assinaturasRouter from '../modules/assinaturas/assinaturas.routes';
import configuracoesRouter from '../modules/configuracoes/configuracoes.routes';
import { proRouter } from '../modules/pro/pro.routes';
import { clientPortalRouter } from '../modules/client-portal/client-portal.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/admins', adminRouter);
router.use('/professionals', professionalRouter);
router.use('/clients', clientRouter);
router.use('/admin/consultas',       consultasRouter);
router.use('/admin/publicacoes',     publicacoesRouter);
router.use('/admin/usuarios',        usuariosRouter);
router.use('/admin/relatorios',      relatoriosRouter);
router.use('/admin/assinaturas',     assinaturasRouter);
router.use('/admin/configuracoes',   configuracoesRouter);
router.use('/pro',                   proRouter);  // Painel do Profissional
router.use('/client-portal',         clientPortalRouter); // Painel do Paciente

export { router as apiRouter };

