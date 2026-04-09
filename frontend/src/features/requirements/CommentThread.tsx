import { useState } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import type { Comentario } from '../../types/comment';
import { useAuth } from '../../context/useAuth';

interface CommentThreadProps {
  comments: Comentario[];
  onAddComment: (text: string) => void;
  onDeleteComment?: (id: number) => void;
}

export default function CommentThread({ comments, onAddComment, onDeleteComment }: CommentThreadProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText('');
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontSize: '13px', fontWeight: 600, color: '#374151' }}>
        💬 Discussão ({comments.length})
      </Typography>

      {comments.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: '#9CA3AF', fontStyle: 'italic' }}>
          Nenhum comentário ainda. Seja o primeiro a comentar.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {comments.map((c, idx) => {
            const initials = c.userName.split(' ').slice(0, 2).map((n) => n[0]).join('');
            const isOwn = user?.id !== undefined && c.userId === Number(user.id);
            return (
              <Box key={c.id}>
                <Box sx={{ display: 'flex', gap: 1.5, py: 1.5, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: isOwn ? 'primary.main' : '#6B7280',
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1A1D23' }}>
                        {c.userName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                        {new Date(c.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      {isOwn && onDeleteComment && (
                        <Tooltip title="Excluir comentário">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteComment(c.id)}
                            sx={{ ml: 'auto', p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}
                          >
                            <DeleteIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
                      {c.texto}
                    </Typography>
                  </Box>
                </Box>
                {idx < comments.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Input */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <Avatar
          sx={{ width: 28, height: 28, fontSize: '11px', fontWeight: 700, bgcolor: 'primary.main', flexShrink: 0, mb: 0.5 }}
        >
          {user?.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
        </Avatar>
        <TextField
          multiline
          maxRows={4}
          fullWidth
          size="small"
          placeholder="Escreva um comentário..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSend(); }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={!text.trim()}
          sx={{ minWidth: 'unset', px: 1.5, py: 1, mb: 0.5 }}
        >
          <SendIcon sx={{ fontSize: 16 }} />
        </Button>
      </Box>
      <Typography variant="caption" sx={{ color: '#9CA3AF', ml: 5 }}>Ctrl+Enter para enviar</Typography>
    </Box>
  );
}
