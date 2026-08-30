import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { analisarImpacto, CORES_TIPO_VINCULO, ROTULOS_TIPO_VINCULO } from '../../utils/traceability';
import { ANIMACAO, ETIQUETA, FONTE_DADOS } from '../../theme/tokens';
import type { RelacaoRequisito } from '../../types/traceability';
import type { RequisitoAPI } from '../../types/requirementAPI';

interface ImpactAnalysisDrawerProps {
  aberto: boolean;
  requisitoOrigemId: string | null;
  requisitos: RequisitoAPI[];
  relacoes: RelacaoRequisito[];
  aoFechar: () => void;
  /** Abre o requisito impactado; quando ausente, os itens não são clicáveis. */
  aoAbrirRequisito?: (requisitoId: string) => void;
  maxSaltos?: number;
}

/**
 * Análise de impacto de mudança.
 *
 * A travessia é apresentada como uma escada de propagação: cada degrau é um
 * salto a partir do requisito alterado, e os requisitos alcançados entram na
 * ordem em que a busca os encontra.
 */
export default function ImpactAnalysisDrawer({
  aberto,
  requisitoOrigemId,
  requisitos,
  relacoes,
  aoFechar,
  aoAbrirRequisito,
  maxSaltos = 3,
}: ImpactAnalysisDrawerProps) {
  const theme = useTheme();

  const requisitoPorId = useMemo(() => new Map(requisitos.map((r) => [r.id, r])), [requisitos]);
  const origem = requisitoOrigemId ? requisitoPorId.get(requisitoOrigemId) : undefined;

  const impactados = useMemo(
    () => (requisitoOrigemId ? analisarImpacto(requisitoOrigemId, relacoes, maxSaltos) : []),
    [requisitoOrigemId, relacoes, maxSaltos],
  );

  const porSalto = useMemo(() => {
    const grupos = new Map<number, typeof impactados>();
    for (const item of impactados) {
      grupos.set(item.saltos, [...(grupos.get(item.saltos) ?? []), item]);
    }
    return [...grupos.entries()].sort((a, b) => a[0] - b[0]);
  }, [impactados]);

  const codigo = (id: string) => requisitoPorId.get(id)?.codigo ?? 'REQ-???';

  /** Ordem em que a busca encontrou cada requisito — define o atraso da entrada. */
  const ordemDeEntrada = useMemo(
    () => new Map(impactados.map((item, indice) => [item.requisitoId, indice])),
    [impactados],
  );

  return (
    <Drawer
      anchor="right"
      open={aberto}
      onClose={aoFechar}
      PaperProps={{ sx: { width: { xs: '100%', sm: 470 }, backgroundImage: 'none' } }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography component="span" sx={{ ...ETIQUETA, color: 'primary.main' }}>
              Análise de impacto
            </Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
              O que uma mudança alcança
            </Typography>
          </Box>
          <IconButton size="small" onClick={aoFechar} aria-label="Fechar análise de impacto">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {origem ? (
          <>
            <Box
              sx={{
                borderLeft: '2px solid',
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 2,
                py: 1.5,
                mb: 3,
              }}
            >
              <Typography
                component="span"
                sx={{ fontFamily: FONTE_DADOS, fontSize: 11.5, fontWeight: 600, color: 'primary.main' }}
              >
                {origem.codigo}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {origem.titulo}
              </Typography>
            </Box>

            {impactados.length === 0 ? (
              <Box
                sx={{
                  border: '1.5px dashed',
                  borderColor: 'divider',
                  px: 2,
                  py: 4,
                  textAlign: 'center',
                }}
              >
                <CloseFullscreenIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Nada além deste requisito é atingido. Ele pode mudar sozinho.
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  <Box component="span" sx={{ fontFamily: FONTE_DADOS, fontWeight: 600 }}>
                    {impactados.length}
                  </Box>{' '}
                  {impactados.length === 1 ? 'requisito é atingido' : 'requisitos são atingidos'} em até{' '}
                  {maxSaltos} saltos.
                </Typography>

                {/* Escada de propagação: um degrau por salto. */}
                <Box sx={{ position: 'relative', pl: 3 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 5,
                      top: 6,
                      bottom: 6,
                      width: '1px',
                      bgcolor: 'divider',
                    }}
                  />

                  {porSalto.map(([salto, itens]) => (
                    <Box key={salto} sx={{ mb: 3.5, position: 'relative' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: -22,
                          top: 3,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'background.paper',
                        }}
                      />
                      <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
                        {salto === 1 ? '1 salto · direto' : `${salto} saltos`}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                        {itens.map((item) => {
                          const requisito = requisitoPorId.get(item.requisitoId);
                          const indireto = item.origem === 'INDIRETO';
                          const cor = indireto
                            ? theme.palette.text.secondary
                            : CORES_TIPO_VINCULO[item.tipo ?? ''] ?? theme.palette.primary.main;
                          const atraso = (ordemDeEntrada.get(item.requisitoId) ?? 0) * 60;

                          return (
                            <Box
                              key={item.requisitoId}
                              onClick={() => aoAbrirRequisito?.(item.requisitoId)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderLeft: `3px ${indireto ? 'dashed' : 'solid'} ${cor}`,
                                p: 1.5,
                                cursor: aoAbrirRequisito ? 'pointer' : 'default',
                                animation: `${ANIMACAO.entradaLateral} 340ms cubic-bezier(0.2, 0.8, 0.2, 1) ${atraso}ms both`,
                                transition: 'border-color 0.15s, background-color 0.15s',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography
                                  component="span"
                                  sx={{ fontFamily: FONTE_DADOS, fontSize: 11, fontWeight: 600 }}
                                >
                                  {requisito?.codigo ?? 'REQ-???'}
                                </Typography>
                                <Typography
                                  component="span"
                                  sx={{ ...ETIQUETA, fontSize: 9, color: cor }}
                                >
                                  {indireto ? 'Indireto' : ROTULOS_TIPO_VINCULO[item.tipo ?? ''] ?? 'Direto'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {requisito?.titulo ?? 'Requisito não encontrado'}
                              </Typography>
                              {indireto && item.entidadesCompartilhadas && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
                                >
                                  compartilha{' '}
                                  <Box component="span" sx={{ fontFamily: FONTE_DADOS, fontSize: 10.5 }}>
                                    {item.entidadesCompartilhadas.join(', ')}
                                  </Box>
                                </Typography>
                              )}
                              <Typography
                                component="span"
                                sx={{
                                  fontFamily: FONTE_DADOS,
                                  fontSize: 10,
                                  color: 'text.disabled',
                                  display: 'block',
                                  mt: 0.5,
                                }}
                              >
                                {item.caminho.map(codigo).join(' → ')}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2 }}>
              A travessia roda a cada abertura, sobre os vínculos e os impactos de dados do momento.
            </Typography>
          </>
        ) : (
          <Typography variant="body2">Escolha um requisito para ver o alcance de uma mudança.</Typography>
        )}

        <Button onClick={aoFechar} fullWidth sx={{ mt: 3 }} variant="outlined">
          Fechar
        </Button>
      </Box>
    </Drawer>
  );
}
