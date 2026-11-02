import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';

interface Props {
  id: string;
  numero: number;
  texto: string;
  /** Rótulos de 1 a 5, na ordem. */
  escala: string[];
  valor: number | null;
  onChange: (valor: number) => void;
}

/**
 * Uma afirmação com a escala de concordância de 1 a 5. RadioGroup nativo: as setas
 * do teclado trocam a opção e o texto da afirmação é o rótulo acessível do grupo.
 */
export default function EscalaConcordancia({ id, numero, texto, escala, valor, onChange }: Props) {
  const rotuloId = `${id}-rotulo`;
  return (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography id={rotuloId} variant="body2" sx={{ fontWeight: 500, mb: 1, lineHeight: 1.5 }}>
        {numero}. {texto}
      </Typography>
      <RadioGroup
        aria-labelledby={rotuloId}
        name={id}
        value={valor === null ? '' : String(valor)}
        onChange={(e) => onChange(Number(e.target.value))}
        sx={{ flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'nowrap', gap: { md: 0.5 } }}
      >
        {escala.map((rotulo, i) => (
          <FormControlLabel
            key={rotulo}
            value={String(i + 1)}
            control={<Radio size="small" />}
            label={<Typography variant="caption" sx={{ lineHeight: 1.3 }}>{i + 1} – {rotulo}</Typography>}
            sx={{ flex: { md: 1 }, mr: 0, alignItems: 'center' }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
