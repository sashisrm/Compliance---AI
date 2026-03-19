import type { BusinessRegion, BusinessType, CloudProvider, FrameworkId, ITOTScope } from './filters';

export type ControlStatus = 'compliant' | 'non-compliant' | 'partial' | 'not-applicable' | 'not-assessed';
export type ControlSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type AnswerValue = 'yes' | 'no' | 'partial' | 'na';

export interface Control {
  id: string;
  frameworkId: FrameworkId;
  category: string;
  subCategory?: string;
  controlNumber: string;
  title: string;
  description: string;
  implementationGuidance: string;
  severity: ControlSeverity;
  applicableScopes: ITOTScope[];
  applicableCloudProviders: CloudProvider[];
  tags: string[];
  references?: string[];
  remediationSteps: string[];
}

export interface ControlDomain {
  id: string;
  name: string;
  description: string;
  controls: Control[];
}

export interface Framework {
  id: FrameworkId;
  name: string;
  shortName: string;
  version: string;
  description: string;
  issuer: string;
  colorClass: string;
  applicableRegions: BusinessRegion[];
  applicableBusinessTypes: BusinessType[];
  applicableScopes: ITOTScope[];
  domains: ControlDomain[];
  totalControls: number;
}
