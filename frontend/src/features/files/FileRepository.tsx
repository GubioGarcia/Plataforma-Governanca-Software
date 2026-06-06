import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  fetchFilesByProject,
  uploadFile,
  downloadFile,
  deleteFile,
  type ArquivoProjetoDTO,
} from '../../services/fileService';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdfIcon sx={{ color: '#E53E3E', fontSize: 20 }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext ?? ''))
    return <ImageIcon sx={{ color: '#38A169', fontSize: 20 }} />;
  if (['doc', 'docx', 'odt', 'txt'].includes(ext ?? ''))
    return <ArticleIcon sx={{ color: '#3182CE', fontSize: 20 }} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext ?? ''))
    return <FolderZipIcon sx={{ color: '#D69E2E', fontSize: 20 }} />;
  return <InsertDriveFileIcon sx={{ color: '#718096', fontSize: 20 }} />;
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function FileRepository() {
  const { projectId } = useParams<{ projectId: string }>();
  const { canEdit } = usePermissions();
  const { notify } = useSnackbar();

  const [files, setFiles] = useState<ArquivoProjetoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ArquivoProjetoDTO | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Carregamento inicial ─────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await fetchFilesByProject(projectId);
      setFiles(data);
    } catch {
      notify('Erro ao carregar arquivos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, notify]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  // ── Upload ───────────────────────────────────────────────────────────────────

  const processFiles = async (fileList: FileList) => {
    if (!projectId) return;

    const errors: string[] = [];
    const MAX_MB = 20;

    const validFiles = Array.from(fileList).filter((f) => {
      if (f.size > MAX_MB * 1024 * 1024) {
        errors.push(`"${f.name}" — excede o limite de ${MAX_MB}MB.`);
        return false;
      }
      return true;
    });

    setUploadErrors(errors);
    if (validFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    const newErrors = [...errors];

    for (const file of validFiles) {
      try {
        const uploaded = await uploadFile(projectId, file);
        setFiles((prev) => [uploaded, ...prev]);
        successCount++;
      } catch (err: unknown) {
        const detail =
          err &&
          typeof err === 'object' &&
          'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : undefined;
        newErrors.push(detail ?? `Erro ao enviar "${file.name}".`);
      }
    }

    setUploading(false);
    setUploadErrors(newErrors);

    if (successCount > 0) {
      notify(
        `${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso`,
        'success',
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  // ── Download (via axios — envia JWT automaticamente) ─────────────────────────

  const handleDownload = async (file: ArquivoProjetoDTO) => {
    setDownloadingId(file.id);
    try {
      await downloadFile(file.id, file.nomeOriginal);
    } catch {
      notify(`Erro ao baixar "${file.nomeOriginal}".`, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Exclusão ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFile(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      notify('Arquivo excluído', 'info');
    } catch {
      notify('Erro ao excluir o arquivo.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 4 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Arquivos</Typography>
          <Typography variant="body2">Repositório de documentos e artefatos do projeto</Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Enviar Arquivo'}
          </Button>
        )}
        <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileSelect} />
      </Box>

      {/* Progresso de upload */}
      {uploading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Erros de upload */}
      {uploadErrors.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {uploadErrors.map((err, i) => (
            <Alert
              key={i}
              severity="error"
              onClose={() => setUploadErrors((prev) => prev.filter((_, j) => j !== i))}
            >
              {err}
            </Alert>
          ))}
        </Box>
      )}

      {/* Zona de drag-and-drop */}
      {canEdit && (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${dragging ? '#3F51B5' : '#D1D5DB'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: dragging ? '#EEF2FF' : '#FAFAFA',
            cursor: uploading ? 'not-allowed' : 'pointer',
            mb: 3,
            transition: 'all 0.2s',
            '&:hover': !uploading ? { borderColor: '#3F51B5', bgcolor: '#F5F7FF' } : {},
          }}
        >
          <UploadFileIcon sx={{ fontSize: 36, color: '#9CA3AF', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Arraste arquivos aqui ou <strong>clique para selecionar</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Qualquer tipo de arquivo — máx. 20 MB
          </Typography>
        </Box>
      )}

      {/* Lista de arquivos */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <EmptyState
          icon={<FolderOpenIcon sx={{ fontSize: 64 }} />}
          title="Nenhum arquivo enviado"
          description="Faça upload de documentos e artefatos do projeto."
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tamanho</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Enviado por</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileTypeIcon name={file.nomeOriginal} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {file.nomeOriginal}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}
                    >
                      {file.extensao}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {formatFileSize(file.tamanhoBytes)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{file.usuarioUpload}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {new Date(file.dataUpload).toLocaleDateString('pt-BR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Baixar">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id}
                        >
                          {downloadingId === file.id
                            ? <CircularProgress size={16} />
                            : <DownloadIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(file)}
                          sx={{ color: '#EF4444' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir arquivo"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nomeOriginal}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Excluir"
        confirmColor="error"
      />
    </Box>
  );
}
