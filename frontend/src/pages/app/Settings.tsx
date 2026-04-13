import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Switch, Slider, MenuItem, Select, FormControl, InputLabel, Button, Divider } from '@mui/material';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [model, setModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [saveHistory, setSaveHistory] = useState(true);

  return (
    <div className="flex flex-col h-full w-full overflow-auto bg-background-dark text-white p-8 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 w-fit transition-colors"
      >
        <ArrowLeft size={18} />
        Back to canvas
      </button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Global Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
        Configure default AI engine parameters and generation settings.
      </Typography>

      <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FormControl fullWidth variant="outlined" sx={{ 
          '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }, 
          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' }
        }}>
          <InputLabel id="model-select-label">Default LLM Model</InputLabel>
          <Select
            labelId="model-select-label"
            value={model}
            label="Default LLM Model"
            onChange={(e) => setModel(e.target.value)}
            sx={{ '& .MuiSvgIcon-root': { color: 'white' } }}
            MenuProps={{ PaperProps: { sx: { bgcolor: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } } }}
          >
            <MenuItem value="gpt-4">GPT-4 Turbo</MenuItem>
            <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
            <MenuItem value="claude-3-opus">Claude 3 Opus</MenuItem>
            <MenuItem value="gemini-pro">Gemini Pro</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography gutterBottom sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
            Global Temperature: {temperature}
          </Typography>
          <Slider
            value={temperature}
            onChange={(_, newValue) => setTemperature(newValue as number)}
            step={0.1}
            marks
            min={0}
            max={2}
            sx={{ color: '#a78bfa' }}
          />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Higher values make output more random, lower values make it more focused and deterministic.
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>Save Generation History</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Automatically backup prompt inputs and outputs across all projects.</Typography>
          </Box>
          <Switch 
            checked={saveHistory} 
            onChange={(e) => setSaveHistory(e.target.checked)} 
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a78bfa' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#a78bfa' } }} 
          />
        </Box>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button variant="contained" sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', fontWeight: 'bold', px: 4 }}>
            Save Settings
          </Button>
        </Box>
      </Box>
    </div>
  );
};

const SettingsPageRoute = () => {
  return (
    <main className="flex-1 relative bg-background-dark overflow-hidden">
      <SettingsPage />
    </main>
  );
};

export default SettingsPageRoute;
