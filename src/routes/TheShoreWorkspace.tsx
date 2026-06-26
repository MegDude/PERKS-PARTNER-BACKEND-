import React from 'react';
import { theShoreWorkspace } from '@/data/theShoreWorkspace';
import { PartnerWorkspaceTemplate } from '@/components/workspace/PartnerWorkspaceTemplate';

export default function TheShoreWorkspace() {
  return <PartnerWorkspaceTemplate {...theShoreWorkspace} />;
}
