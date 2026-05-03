import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import ViewListIcon from '@mui/icons-material/ViewList';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  fetchEventsByProject,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../services/eventService';
import type { EventoProjeto } from '../../types/event';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toLocalDT(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── CalendarView ────────────────────────────────────────────────────────────
function CalendarView({ events, onEdit, onDelete }: {
  events: EventoProjeto[];
  onEdit: (e: EventoProjeto) => void;
  onDelete: (e: EventoProjeto) => void;
}) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsMonth = events.filter((e) => {
    const d = parseDate(e.dataHoraInicio);
    return d && d.getFullYear() === year && d.getMonth() === month;
  });

  function eventsOnDay(day: number) {
    return eventsMonth.filter((e) => parseDate(e.dataHoraInicio)?.getDate() === day);
  }

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = current
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^(\w)/, (c) => c.toUpperCase());

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
      <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 520 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton size="small" onClick={() => setCurrent(new Date(year, month - 1, 1))} sx={{ border: '1px solid #E8EAED', borderRadius: 1 }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{monthLabel}</Typography>
          <IconButton size="small" onClick={() => setCurrent(new Date(year, month + 1, 1))} sx={{ border: '1px solid #E8EAED', borderRadius: 1 }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
          {WEEKDAYS.map((d, i) => (
            <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 700, fontSize: 11, color: i === 0 || i === 6 ? '#EF4444' : '#9CA3AF', py: 0.5 }}>
              {d}
            </Typography>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {cells.map((day, i) => {
            if (!day) return <Box key={i} />;
            const dayEvents = eventsOnDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const isWeekend = i % 7 === 0 || i % 7 === 6;
            return (
              <Box
                key={i}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                sx={{
                  height: 56, borderRadius: 1.5, cursor: 'pointer',
                  border: isSelected ? '2px solid #3F51B5' : '1px solid transparent',
                  bgcolor: isSelected ? '#EEF2FF' : isToday ? '#F0FDF4' : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', pt: 0.75, gap: 0.5,
                  '&:hover': { bgcolor: isSelected ? '#EEF2FF' : '#F3F4F6', borderColor: '#D1D5DB' },
                  transition: 'all 0.12s',
                }}
              >
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: isToday ? '#3F51B5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: isToday || isSelected ? 700 : 400, fontSize: 12, color: isToday ? '#fff' : isWeekend ? '#EF4444' : '#374151', lineHeight: 1 }}>
                    {day}
                  </Typography>
                </Box>
                {dayEvents.length > 0 && (
                  <Box sx={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center', px: 0.5 }}>
                    {dayEvents.slice(0, 4).map((ev) => (
                      <Box key={ev.id} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3F51B5' }} />
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {selectedDay ? (
          <>
            <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid #E8EAED' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {new Date(year, month, selectedDay).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^(\w)/, (c) => c.toUpperCase())}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                {selectedEvents.length === 0 ? 'Nenhum evento' : `${selectedEvents.length} evento${selectedEvents.length > 1 ? 's' : ''}`}
              </Typography>
            </Box>
            {selectedEvents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <EventIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Nenhum evento neste dia.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedEvents.map((ev) => (
                  <Card key={ev.id} elevation={0} sx={{ border: '1px solid #E8EAED', borderLeft: '4px solid #3F51B5', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{ev.nome}</Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: ev.descricao ? 1 : 0 }}>
                            🕐 {ev.dataHoraInicio && ev.dataHoraFim
                              ? `${new Date(ev.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — ${new Date(ev.dataHoraFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Horário indisponível'}
                          </Typography>
                          {ev.descricao && <Typography variant="body2" sx={{ color: '#4B5563', fontSize: 13 }}>{ev.descricao}</Typography>}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => onEdit(ev)}><EditIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                          <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => onDelete(ev)}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CalendarMonthIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Selecione um dia para ver os eventos.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────
export default function EventTimeline() {
  const { orgId, projectId } = useParams();
  const { notify } = useSnackbar();
  const [allEvents, setAllEvents] = useState<EventoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'agenda'>('timeline');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventoProjeto | null>(null);

  const EMPTY = { nome: '', descricao: '', dataHoraInicio: '', dataHoraFim: '' };
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetchEventsByProject(projectId)
      .then(setAllEvents)
      .catch(() => notify('Falha ao carregar eventos', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(ev: EventoProjeto) {
    setEditingId(String(ev.id));
    setForm({
      nome: ev.nome,
      descricao: ev.descricao ?? '',
      dataHoraInicio: toLocalDT(ev.dataHoraInicio),
      dataHoraFim: toLocalDT(ev.dataHoraFim),
    });
    setDialogOpen(true);
  }

  const handleSave = async () => {
    if (!form.nome.trim() || !form.dataHoraInicio || !projectId) return;
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      dataHoraInicio: new Date(form.dataHoraInicio).toISOString(),
      dataHoraFim: form.dataHoraFim ? new Date(form.dataHoraFim).toISOString() : undefined,
    };
    try {
      if (editingId) {
        const updated = await updateEvent(editingId, payload);
        setAllEvents((prev) => prev.map((ev) => ev.id === editingId ? updated : ev));
        notify('Evento atualizado', 'success');
      } else {
        if (!orgId) { notify('Organização não informada', 'error'); return; }
        const created = await createEvent({ ...payload, projetoId: projectId, organizacaoId: orgId });
        setAllEvents((prev) => [...prev, created]);
        notify('Evento criado com sucesso', 'success');
      }
      setDialogOpen(false);
    } catch {
      notify('Não foi possível salvar o evento.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(String(deleteTarget.id));
      setAllEvents((prev) => prev.filter((ev) => ev.id !== deleteTarget.id));
      notify('Evento excluído', 'info');
    } catch {
      notify('Não foi possível excluir o evento.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const events = [...allEvents].sort((a, b) => (parseDate(a.dataHoraInicio)?.getTime() ?? 0) - (parseDate(b.dataHoraInicio)?.getTime() ?? 0));

  const grouped: Record<string, EventoProjeto[]> = {};
  events.forEach((e) => {
    const d = parseDate(e.dataHoraInicio);
    const key = d ? d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem data';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Eventos</Typography>
          <Typography variant="body2">Reuniões, workshops, entregas e revisões do projeto</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setView('timeline')} variant={view === 'timeline' ? 'contained' : 'outlined'} startIcon={<ViewListIcon />}>Timeline</Button>
            <Button onClick={() => setView('agenda')} variant={view === 'agenda' ? 'contained' : 'outlined'} startIcon={<CalendarMonthIcon />}>Agenda</Button>
          </ButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openCreate}>Novo Evento</Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : events.length === 0 ? (
        <EmptyState icon={<EventIcon sx={{ fontSize: 64 }} />} title="Nenhum evento cadastrado" description="Adicione reuniões, workshops e entregas." />
      ) : view === 'agenda' ? (
        <CalendarView events={events} onEdit={openEdit} onDelete={(ev) => setDeleteTarget(ev)} />
      ) : (
        Object.entries(grouped).map(([month, monthEvents]) => (
          <Box key={month} sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', mb: 1, display: 'block', pl: 1 }}>
              {month}
            </Typography>
            <Timeline sx={{ p: 0, m: 0, [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } }}>
              {monthEvents.map((event, idx) => {
                const d = parseDate(event.dataHoraInicio);
                const isPast = d ? d < new Date() : false;
                return (
                  <TimelineItem key={event.id}>
                    <TimelineSeparator>
                      <TimelineDot color={isPast ? 'grey' : 'primary'} variant={isPast ? 'filled' : 'outlined'} sx={{ my: 1 }} />
                      {idx < monthEvents.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ pb: 2 }}>
                      <Card sx={{ border: `1px solid ${isPast ? '#E8EAED' : '#3F51B515'}`, opacity: isPast ? 0.7 : 1 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>{event.nome}</Typography>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: event.descricao ? 1 : 0 }}>
                                {event.dataHoraInicio
                                  ? new Date(event.dataHoraInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : 'Data indisponível'}
                              </Typography>
                              {event.descricao && <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6 }}>{event.descricao}</Typography>}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(event)}><EditIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                              <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => setDeleteTarget(event)}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          </Box>
        ))
      )}

      {/* Dialog criar / editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField label="Nome do evento" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} fullWidth autoFocus required placeholder="Ex.: Kick-off com Stakeholders" />
          <TextField label="Data e hora de início" type="datetime-local" value={form.dataHoraInicio} onChange={(e) => setForm((f) => ({ ...f, dataHoraInicio: e.target.value }))} fullWidth required InputLabelProps={{ shrink: true }} />
          <TextField label="Data e hora de término" type="datetime-local" value={form.dataHoraFim} onChange={(e) => setForm((f) => ({ ...f, dataHoraFim: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Descrição" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} fullWidth multiline rows={3} placeholder="Detalhes do evento..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.nome.trim() || !form.dataHoraInicio}>
            {editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir evento"
        message={`Deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}