import { useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { CommentSection } from '../comments';
import AuditCard, { type AuditCardHandle } from '../audit/AuditCard';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface InfoCardRow {
  label: string;
  value?: string | null;
}

export interface AuditProps {
  /** Tipo da entidade auditada, ex.: 'WIKI_PROBLEMA' */
  entidadeTipo: string;
  /** ID da entidade (wiki.id para VisaoProduto, projeto.id para Descricao) */
  entidadeId: string;
}

interface WikiEditLayoutProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
  infoRows?: InfoCardRow[];
  commentProps?: {
    entidadeTipo: string;
    entidadeId: string;
    projetoId: string;
    organizacaoId: string;
  };
  /** Quando fornecido, exibe o card de Alterações na sidebar */
  auditProps?: AuditProps;
  /** Ref para forçar reload do AuditCard após salvar */
  auditCardRef?: React.Ref<AuditCardHandle>;
}

export default function WikiEditLayout({
  title,
  subtitle,
  onBack,
  children,
  infoRows,
  commentProps,
  auditProps,
  auditCardRef,
}: WikiEditLayoutProps) {
  const internalAuditRef = useRef<AuditCardHandle>(null);
  const resolvedAuditRef = auditCardRef ?? internalAuditRef;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          color: '#3F51B5',
          fontWeight: 600,
          mb: 2,
          px: 0,
          '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
        }}
      >
        Voltar
      </Button>

      <Typography variant="h2" sx={{ fontWeight: 700, fontSize: '28px', color: '#111827', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
        {subtitle}
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* ── Coluna principal ── */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {children}

          {commentProps && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <CommentSection
                  entidadeTipo={commentProps.entidadeTipo}
                  entidadeId={commentProps.entidadeId}
                  projetoId={commentProps.projetoId}
                  organizacaoId={commentProps.organizacaoId}
                />
              </CardContent>
            </Card>
          )}
        </Box>

        {/* ── Sidebar ── */}
        {(infoRows?.length || auditProps) && (
          <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Informações */}
            {infoRows && infoRows.length > 0 && (
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#111827' }}>
                    Informações
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {infoRows.map((row) => (
                    <Box key={row.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
                        <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 11 }}>
                          {row.label}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ pl: 2.5, fontWeight: 500, fontSize: 13 }}>
                        {formatDateTime(row.value)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Alterações */}
            {auditProps && (
              <AuditCard
                ref={resolvedAuditRef}
                entidadeTipo={auditProps.entidadeTipo}
                entidadeId={auditProps.entidadeId}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
