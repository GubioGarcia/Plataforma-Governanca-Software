import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

type Severity = 'success' | 'error' | 'warning' | 'info';

interface SnackMsg {
  message: string;
  severity: Severity;
  key: number;
}

interface SnackbarCtx {
  notify: (message: string, severity?: Severity) => void;
}

const SnackbarContext = createContext<SnackbarCtx>({ notify: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export function useSnackbar() {
  return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SnackMsg | null>(null);
  // Fila e "ocupado" em refs: o notify não depende de estado e mantém a mesma
  // identidade. Muitas telas o têm nas dependências do useEffect de carga; se ele
  // mudasse a cada abertura do snackbar, a tela recarregaria (e, num erro, em laço).
  const fila = useRef<SnackMsg[]>([]);
  const ocupado = useRef(false);
  const proximaChave = useRef(0);

  const exibir = useCallback((msg: SnackMsg) => {
    ocupado.current = true;
    setCurrent(msg);
    setOpen(true);
  }, []);

  const notify = useCallback((message: string, severity: Severity = 'success') => {
    const entry: SnackMsg = { message, severity, key: ++proximaChave.current };
    if (ocupado.current) fila.current.push(entry);
    else exibir(entry);
  }, [exibir]);

  const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  // Só depois da animação de saída mostra a próxima mensagem da fila
  const handleExited = () => {
    const next = fila.current.shift();
    if (next) exibir(next);
    else ocupado.current = false;
  };

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={3500}
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={current?.severity ?? 'success'}
          variant="filled"
          sx={{ minWidth: 280 }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
