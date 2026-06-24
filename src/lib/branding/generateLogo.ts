export function generateLogo(entity: any) {
  const name = entity.name.toUpperCase();
  const type = (entity.type || "").toLowerCase();

  if (type === "hotel" || type === "real_estate") {
    return `
      <svg viewBox="0 0 200 60">
        <text x="0" y="40" font-size="26" letter-spacing="6" fill="#0A1422">
          ${name}
        </text>
      </svg>
    `;
  }

  if (type === "civic") {
    return `
      <svg viewBox="0 0 120 120">
        <rect x="10" y="10" width="100" height="100" stroke="#0A1422" fill="none"/>
        <text x="60" y="65" text-anchor="middle">${name}</text>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 120 120">
      <text x="50%" y="55%" text-anchor="middle">${name.slice(0,2)}</text>
    </svg>
  `;
}
