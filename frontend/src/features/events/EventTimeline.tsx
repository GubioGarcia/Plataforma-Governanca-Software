import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import { mockEvents } from '../../mocks/events';
import type { EventoProjeto, TipoEventoProjeto } from '../../types/event';

const TIPO_COLOR: Record<TipoEventoProjeto, string> = {
  REUNIAO: '#3F51B5',
  WORKSHOP: '#059669',
  ENTREGA: '#7C3AED',
  REVISAO: '#D97706',
  DEMO: '#DC2626',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function CalendarView({ events, onEdit, onDelete }: {
  events: EventoProjeto[];
  onEdit: (ev: EventoProjeto) => void;
  onDelete: (ev: EventoProjeto) => void;
}) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsThisMonth = events.filter((e) => {
    const d = new Date(e.data);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  function eventsOnDay(day: number) {
    return eventsThisMonth.filter((e) => new Date(e.data).getDate() === day);
  }

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = current
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^(\w)/, (c) => c.toUpperCase())
    .replace(/ de /, ' de ');

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
      {/* ── Left: grid ── */}
      <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 520 } }}>
        {/* Month nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            sx={{ border: '1px solid #E8EAED', borderRadius: 1 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {monthLabel}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            sx={{ border: '1px solid #E8EAED', borderRadius: 1 }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Weekday row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
          {WEEKDAYS.map((d, i) => (
            <Typography
              key={d}
              variant="caption"
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 11,
                color: i === 0 || i === 6 ? '#EF4444' : '#9CA3AF',
                py: 0.5,
                letterSpacing: '0.04em',
              }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {/* Day cells */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {cells.map((day, i) => {
            if (!day) return <Box key={i} />;
            const dayEvents = eventsOnDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const isWeekend = (i % 7 === 0) || (i % 7 === 6);
            const hasEvents = dayEvents.length > 0;

            return (
              <Box
                key={i}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                sx={{
                  height: 56,
                  borderRadius: 1.5,
                  border: isSelected
                    ? '2px solid #3F51B5'
                    : '1px solid transparent',
                  bgcolor: isSelected
                    ? '#EEF2FF'
                    : isToday
                    ? '#F0FDF4'
                    : isWeekend
                    ? 'rgba(255,255,255,0.02)'
                    : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  pt: 0.75,
                  gap: 0.5,
                  '&:hover': { bgcolor: isSelected ? '#EEF2FF' : '#F3F4F6', borderColor: '#D1D5DB' },
                  transition: 'all 0.12s',
                }}
              >
                {/* Day number */}
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: isToday ? '#3F51B5' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday || isSelected ? 700 : 400,
                      fontSize: 12,
                      color: isToday ? '#fff' : isWeekend ? '#EF4444' : '#374151',
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </Typography>
                </Box>

                {/* Event dots */}
                {hasEvents && (
                  <Box sx={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center', px: 0.5 }}>
                    {dayEvents.slice(0, 4).map((ev) => (
                      <Box
                        key={ev.id}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: TIPO_COLOR[ev.tipo],
                          flexShrink: 0,
                        }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <Typography variant="caption" sx={{ fontSize: 9, color: '#9CA3AF', lineHeight: '6px' }}>
                        +{dayEvents.length - 4}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Legenda */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2.5, pl: 0.5 }}>
          {(Object.entries(TIPO_COLOR) as [TipoEventoProjeto, string][]).map(([tipo, color]) => (
            <Box key={tipo} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" sx={{ color: '#6B7280', fontSize: 11 }}>
                {tipo === 'REUNIAO' ? 'Reunião'
                  : tipo === 'WORKSHOP' ? 'Workshop'
                  : tipo === 'ENTREGA' ? 'Entrega'
                  : tipo === 'REVISAO' ? 'Revisão'
                  : 'Demo'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right: detail panel ── */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {selectedDay ? (
          <>
            <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid #E8EAED' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                {new Date(year, month, selectedDay).toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                }).replace(/^(\w)/, (c) => c.toUpperCase())}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                {selectedEvents.length === 0
                  ? 'Nenhum evento'
                  : `${selectedEvents.length} evento${selectedEvents.length > 1 ? 's' : ''}`}
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
                  <Card
                    key={ev.id}
                    elevation={0}
                    sx={{
                      border: '1px solid #E8EAED',
                      borderLeft: `4px solid ${TIPO_COLOR[ev.tipo]}`,
                      borderRadius: 1.5,
                      '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>{ev.nome}</Typography>
                            <StatusChip status={ev.tipo} />
                          </Box>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: ev.descricao ? 1 : 0 }}>
                            🕐 {new Date(ev.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          {ev.descricao && (
                            <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6, fontSize: 13 }}>
                              {ev.descricao}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => onEdit(ev)}>
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton size="small" color="error" onClick={() => onDelete(ev)}>
                              <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
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

export default function EventTimeline() {
  const { projectId } = useParams();
  const { notify } = useSnackbar();
  const [allEvents, setAllEvents] = useState<EventoProjeto[]>(mockEvents);
  const [view, setView] = useState<'timeline' | 'agenda'>('timeline');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const EMPTY_FORM = { nome: '', descricao: '', tipo: 'REUNIAO' as TipoEventoProjeto, data: '' };
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<EventoProjeto | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(ev: EventoProjeto) {
    setEditingId(ev.id);
    const d = new Date(ev.data);
    const pad = (n: number) => String(n).padStart(2, '0');
    setForm({
      nome: ev.nome,
      descricao: ev.descricao ?? '',
      tipo: ev.tipo,
      data: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    });
    setDialogOpen(true);
  }

  const handleSave = () => {
    if (!form.nome.trim() || !form.data) return;
    if (editingId !== null) {
      setAllEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingId
            ? { ...ev, nome: form.nome.trim(), descricao: form.descricao.trim(), tipo: form.tipo, data: new Date(form.data).toISOString(), updatedAt: new Date().toISOString() }
            : ev
        )
      );
    } else {
      const newEvent: EventoProjeto = {
        id: Date.now(),
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        data: new Date(form.data).toISOString(),
        projetoId: Number(projectId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'João Silva',
      };
      setAllEvents((prev) => [...prev, newEvent]);
    }
    setForm(EMPTY_FORM);
    setDialogOpen(false);
    notify(editingId !== null ? 'Evento atualizado' : 'Evento criado com sucesso');
  };

  const handleDeleteEvent = () => {
    if (!deleteTarget) return;
    setAllEvents((prev) => prev.filter((ev) => ev.id !== deleteTarget.id));
    setDeleteTarget(null);
    notify('Evento excluído', 'info');
  };

  const events = allEvents
    .filter((e) => e.projetoId === Number(projectId))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const grouped: Record<string, typeof events> = {};
  events.forEach((e) => {
    const key = new Date(e.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setView('timeline')}
              variant={view === 'timeline' ? 'contained' : 'outlined'}
              startIcon={<ViewListIcon />}
            >
              Timeline
            </Button>
            <Button
              onClick={() => setView('agenda')}
              variant={view === 'agenda' ? 'contained' : 'outlined'}
              startIcon={<CalendarMonthIcon />}
            >
              Agenda
            </Button>
          </ButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openCreate}>
            Novo Evento
          </Button>
        </Box>
      </Box>

      {events.length === 0 ? (
        <EmptyState icon={<EventIcon sx={{ fontSize: 64 }} />} title="Nenhum evento cadastrado" description="Adicione reuniões, workshops e entregas." />
      ) : view === 'agenda' ? (
        <CalendarView events={events} onEdit={openEdit} onDelete={(ev) => setDeleteTarget(ev)} />
      ) : (
        Object.entries(grouped).map(([month, monthEvents]) => (
          <Box key={month} sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                mb: 1,
                display: 'block',
                pl: 1,
              }}
            >
              {month}
            </Typography>
            <Timeline
              sx={{
                p: 0,
                m: 0,
                [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
              }}
            >
              {monthEvents.map((event, idx) => {
                const isPast = new Date(event.data) < new Date();
                const dotColor: 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'grey' =
                  event.tipo === 'REUNIAO' ? 'primary'
                    : event.tipo === 'WORKSHOP' ? 'success'
                    : event.tipo === 'ENTREGA' ? 'secondary'
                    : event.tipo === 'REVISAO' ? 'warning'
                    : 'error';

                return (
                  <TimelineItem key={event.id}>
                    <TimelineSeparator>
                      <TimelineDot color={isPast ? 'grey' : dotColor} variant={isPast ? 'filled' : 'outlined'} sx={{ my: 1 }} />
                      {idx < monthEvents.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ pb: 2 }}>
                      <Card sx={{ border: `1px solid ${isPast ? '#E8EAED' : '#3F51B515'}`, opacity: isPast ? 0.7 : 1 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography variant="h6">{event.nome}</Typography>
                                <StatusChip status={event.tipo as TipoEventoProjeto} />
                              </Box>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: event.descricao ? 1 : 0 }}>
                                {new Date(event.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              {event.descricao && (
                                <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6 }}>
                                  {event.descricao}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                              <Tooltip title="Editar evento">
                                <IconButton size="small" onClick={() => openEdit(event)}>
                                  <EditIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir evento">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(event)}>
                                  <DeleteIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId !== null ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome do evento"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            fullWidth
            autoFocus
            required
            placeholder="Ex.: Kick-off com Stakeholders"
          />
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoEventoProjeto }))}
            >
              <MenuItem value="REUNIAO">Reunião</MenuItem>
              <MenuItem value="WORKSHOP">Workshop</MenuItem>
              <MenuItem value="ENTREGA">Entrega</MenuItem>
              <MenuItem value="REVISAO">Revisão</MenuItem>
              <MenuItem value="DEMO">Demo</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Data e hora"
            type="datetime-local"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            placeholder="Detalhes do evento..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.nome.trim() || !form.data}>
            {editingId !== null ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir evento"
        message={`Deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
