import React from 'react';

export function ResidentPanel({ entity }: any) { return <div className="p-4">Resident Panel: {entity?.name}</div>; }
export function PartnerPanel({ entity }: any) { return <div className="p-4">Partner Panel: {entity?.name}</div>; }
export function ResidentQRCode({ entity }: any) { return <div className="p-4">QR Code for {entity?.name}</div>; }
export function PartnerScanner() { return <div className="p-4">Partner Scanner</div>; }

export function SelectionPanelContent({ mode, entity }: any) {
  if (mode === "resident") {
    return <ResidentPanel entity={entity} />;
  }

  if (mode === "partner") {
    return <PartnerPanel entity={entity} />;
  }

  return null;
}

export function QRContent({ mode, entity }: any) {
  if (mode === "resident") {
    return <ResidentQRCode entity={entity} />;
  }

  if (mode === "partner") {
    return <PartnerScanner />;
  }

  return null;
}
