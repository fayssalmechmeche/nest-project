/**
 * Détermine si le texte doit être blanc ou noir selon la couleur de fond
 */
export const getContrastColor = (
  hexColor: string,
  isTimestamp = false
): string => {
  // Convertir la couleur hexadécimale en RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculer la luminosité (formule standard)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Si c'est pour l'horodatage, on utilise un blanc ou gris plus transparent
  if (isTimestamp) {
    return luminance > 0.5 ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.8)";
  }

  // Retourner blanc ou noir selon la luminosité
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

/**
 * Génère une couleur aléatoire
 */
export const generateRandomColor = (): string => {
  const colors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#EC4899", // Pink
    "#6366F1", // Indigo
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};
