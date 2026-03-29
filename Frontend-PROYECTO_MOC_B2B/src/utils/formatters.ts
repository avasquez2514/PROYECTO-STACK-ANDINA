export const decodificarObservaciones = (obs: string) => {
  if (!obs) return "--";
  try {
    const parsed = JSON.parse(obs);
    if (typeof parsed === 'object') {
      return Object.entries(parsed)
        .filter(([key, val]) => val && key !== 'incidente' && key !== 'tecnico')
        .map(([_, val]) => `${val}`)
        .join(" ");
    }
  } catch (e) { }
  return obs;
};

export const formatearFecha = (f: string) => {
  if (!f) return "---";
  try {
    const date = new Date(f);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours.toString().padStart(2, '0');

    return `${day}/${month}/${year} | ${strHours}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return f;
  }
};

export const formatearPlantilla = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    return Object.entries(data)
      .map(([key, val]) => {
        let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        if (label.toLowerCase() === 'incidente') label = 'Inc';
        return `${label}: ${val}`;
      })
      .join('\n');
  } catch (e) {
    return jsonString;
  }
};
export const formatSeconds = (seconds: number) => {
  if (!seconds && seconds !== 0) return "---";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};
