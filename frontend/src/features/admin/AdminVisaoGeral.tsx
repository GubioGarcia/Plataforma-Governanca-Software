import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import MetricBand from '../../components/common/MetricBand';
import { useSnackbar } from '../../context/SnackbarContext';
import { obterResumoAdmin } from '../../services/adminService';
import { PADDING_PAGINA } from '../../theme/responsivo';
import type { ResumoAdmin } from '../../types/admin';
import { extractApiErrorMessage } from '../../utils/apiError';
import { statusVisual } from '../../utils/indicadores';

/** Visão geral da plataforma: só contagens, sem conteúdo de projeto. */
export default function AdminVisaoGeral() {
  const { notify } = useSnackbar();
  const [resumo, setResumo] = useState<ResumoAdmin | null>(null);
  const [erro, setErro] = useState(false);

  // Incrementada pelo "Tentar novamente" para refazer a busca
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    obterResumoAdmin()
      .then((dados) => { if (ativo) setResumo(dados); })
      .catch((err) => {
        if (!ativo) return;
        setErro(true);
        notify(extractApiErrorMessage(err, 'Não foi possível carregar a visão geral.'), 'error');
      });
    return () => { ativo = false; };
  }, [tentativa, notify]);

  return (
    <Box sx={{ p: PADDING_PAGINA, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h2" component="h1">Visão geral</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Números gerais da plataforma. As contas de administração não entram na contagem de usuários.
      </Typography>

      {!resumo && !erro && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {erro && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Não foi possível carregar a visão geral.</Typography>
          <Button variant="outlined" onClick={() => { setErro(false); setTentativa((t) => t + 1); }}>Tentar novamente</Button>
        </Box>
      )}

      {resumo && (
        <>
          <MetricBand
            leituras={[
              { rotulo: 'Usuários ativos', valor: resumo.usuariosAtivos, cor: '#16A34A' },
              { rotulo: 'Usuários inativos', valor: resumo.usuariosInativos, cor: '#9CA3AF' },
              { rotulo: 'Organizações', valor: resumo.organizacoes, cor: '#3F51B5', detalhe: 'ativas' },
              { rotulo: 'Projetos', valor: resumo.projetos, cor: '#7C3AED', detalhe: 'ativos' },
              { rotulo: 'Solicitações', valor: resumo.solicitacoesPendentes, cor: '#D97706', detalhe: 'pendentes' },
            ]}
          />
          <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>Requisitos por status</Typography>
          {Object.keys(resumo.requisitosPorStatus).length === 0 ? (
            <Typography variant="body2" color="text.secondary">Nenhum requisito cadastrado.</Typography>
          ) : (
            <MetricBand
              leituras={Object.entries(resumo.requisitosPorStatus).map(([status, total]) => ({
                rotulo: statusVisual(status).label,
                valor: total,
                cor: statusVisual(status).color,
              }))}
            />
          )}
        </>
      )}
    </Box>
  );
}
