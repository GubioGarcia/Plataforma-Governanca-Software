import { createContext, useContext, useState, useCallback } from 'react';
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

export function useSnackbar() {
  return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [_queue, setQueue] = useState<SnackMsg[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SnackMsg | null>(null);

  const processQueue = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      setCurrent(next);
      setOpen(true);
      return rest;
    });
  }, []);

  const notify = useCallback((message: string, severity: Severity = 'success') => {
    setQueue((prev) => {
      const entry: SnackMsg = { message, severity, key: Date.now() };
      const next = [...prev, entry];
      if (!open && prev.length === 0) {
        setCurrent(entry);
        setOpen(true);
        return [];
      }
      return next;
    });
  }, [open]);

  const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    processQueue();
  };

  return (
    <SnackbarContext.Provider value={{ notify }}>
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
