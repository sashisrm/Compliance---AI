export type BusinessRegion =
  | 'north-america'
  | 'european-union'
  | 'united-kingdom'
  | 'asia-pacific'
  | 'middle-east'
  | 'latin-america'
  | 'global';

export type BusinessType =
  | 'insurance'
  | 'bfsi'
  | 'telecom'
  | 'industrial-automation'
  | 'healthcare'
  | 'digital-media'
  | 'retail'
  | 'government';

export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'hybrid' | 'on-premise' | 'none';

export type ITOTScope = 'it-only' | 'ot-only' | 'it-ot-both';

export type FrameworkId =
  | 'nist-csf'
  | 'nist-800-53'
  | 'iso-27001'
  | 'iso-27002'
  | 'gdpr'
  | 'pci-dss'
  | 'iec-62443'
  | 'hipaa'
  | 'soc2'
  | 'ccpa'
  | 'responsible-ai'
  | 'eu-ai-act'
  | 'cra';

export const REGION_LABELS: Record<BusinessRegion, string> = {
  'north-america': 'North America',
  'european-union': 'European Union',
  'united-kingdom': 'United Kingdom',
  'asia-pacific': 'Asia Pacific',
  'middle-east': 'Middle East',
  'latin-america': 'Latin America',
  'global': 'Global / Multi-Region',
};

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  'insurance': 'Insurance',
  'bfsi': 'BFSI (Banking, Financial Services)',
  'telecom': 'Telecom',
  'industrial-automation': 'Industrial Automation (OT/ICS)',
  'healthcare': 'Healthcare',
  'digital-media': 'Digital Media',
  'retail': 'Retail / E-Commerce',
  'government': 'Government / Public Sector',
};

export const CLOUD_PROVIDER_LABELS: Record<CloudProvider, string> = {
  'aws': 'Amazon Web Services (AWS)',
  'azure': 'Microsoft Azure',
  'gcp': 'Google Cloud Platform (GCP)',
  'hybrid': 'Hybrid Cloud',
  'on-premise': 'On-Premise',
  'none': 'No Cloud (Air-Gapped)',
};

export const ITOT_LABELS: Record<ITOTScope, string> = {
  'it-only': 'IT Only (Information Technology)',
  'ot-only': 'OT Only (Operational Technology / ICS)',
  'it-ot-both': 'IT + OT (Converged Environment)',
};
