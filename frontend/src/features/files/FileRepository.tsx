import { useRef, useState } from 'react';
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
import { mockFiles } from '../../mocks/files';
import type { Arquivo } from '../../types/file';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdfIcon sx={{ color: '#E53E3E', fontSize: 20 }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext ?? '')) return <ImageIcon sx={{ color: '#38A169', fontSize: 20 }} />;
  if (['doc', 'docx', 'odt', 'txt'].includes(ext ?? '')) return <ArticleIcon sx={{ color: '#3182CE', fontSize: 20 }} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext ?? '')) return <FolderZipIcon sx={{ color: '#D69E2E', fontSize: 20 }} />;
  return <InsertDriveFileIcon sx={{ color: '#718096', fontSize: 20 }} />;
}

export default function FileRepository() {
  const { projectId } = useParams();
  const { canEdit } = usePermissions();
  const { notify } = useSnackbar();
  const [files, setFiles] = useState<Arquivo[]>(mockFiles.filter((f) => f.projetoId === Number(projectId)));
  const [deleteTarget, setDeleteTarget] = useState<Arquivo | null>(null); // eslint-disable-line
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
    notify('Arquivo excluído', 'info');
  };

  const processFiles = (fileList: FileList) => {
    const entries: Arquivo[] = Array.from(fileList).map((f, i) => ({
      id: Date.now() + i,
      nome: f.name,
      tipo: f.name.split('.').pop()?.toLowerCase() ?? 'arquivo',
      tamanho: f.size,
      url: URL.createObjectURL(f),
      projetoId: Number(projectId),
      uploadadoPor: 'João Silva',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setFiles((prev) => [...entries, ...prev]);
    notify(`${entries.length} arquivo${entries.length > 1 ? 's' : ''} enviado${entries.length > 1 ? 's' : ''} com sucesso`);
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

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Arquivos</Typography>
          <Typography variant="body2">Repositório de documentos e artefatos do projeto</Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            size="small"
            onClick={() => fileInputRef.current?.click()}
          >
            Enviar Arquivo
          </Button>
        )}
        <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileSelect} />
      </Box>

      {/* Drag and drop zone */}
      {canEdit && (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${dragging ? '#3F51B5' : '#D1D5DB'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: dragging ? '#EEF2FF' : '#FAFAFA',
            cursor: 'pointer',
            mb: 3,
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#3F51B5', bgcolor: '#F5F7FF' },
          }}
        >
          <UploadFileIcon sx={{ fontSize: 36, color: '#9CA3AF', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Arraste arquivos aqui ou <strong>clique para selecionar</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PDF, Word, imagens, ZIP — máx. 50 MB
          </Typography>
        </Box>
      )}

      {files.length === 0 ? (
        <EmptyState icon={<FolderOpenIcon sx={{ fontSize: 64 }} />} title="Nenhum arquivo enviado" description="Faça upload de documentos e artefatos do projeto." />
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
                      <FileTypeIcon name={file.nome} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {file.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
                      {file.tipo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {formatFileSize(file.tamanho)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{file.uploadadoPor}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Baixar">
                      <IconButton size="small" href={file.url} target="_blank">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => setDeleteTarget(file)} sx={{ color: '#EF4444' }}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir arquivo"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Excluir"
        confirmColor="error"
      />
    </Box>
  );
}
