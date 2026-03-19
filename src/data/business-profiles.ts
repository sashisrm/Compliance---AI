import type { BusinessRegion, BusinessType, FrameworkId } from '../types/filters';

export interface FrameworkApplicability {
  frameworkId: FrameworkId;
  mandatory: boolean;
  weight: number;
  rationale: string;
}

type RegionKey = BusinessRegion | 'global';

export const businessFrameworkMatrix: Record<BusinessType, Partial<Record<RegionKey, FrameworkApplicability[]>>> = {
  'bfsi': {
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU data protection regulation (mandatory)' },
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing requirement' },
      { frameworkId: 'eu-ai-act',      mandatory: true,  weight: 0.9, rationale: 'EU AI Act mandatory for AI-enabled financial services' },
      { frameworkId: 'cra',            mandatory: true,  weight: 0.9, rationale: 'EU Cyber Resilience Act for digital products' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'Industry ISMS standard' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.8, rationale: 'Responsible AI governance for credit/risk models' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.6, rationale: 'Risk management framework' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.5, rationale: 'Third-party assurance' },
    ],
    'north-america': [
      { frameworkId: 'nist-csf',       mandatory: false, weight: 1.0, rationale: 'US federal cybersecurity standard' },
      { frameworkId: 'nist-800-53',    mandatory: false, weight: 0.8, rationale: 'Detailed control catalog' },
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing requirement' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.9, rationale: 'Customer trust requirement' },
      { frameworkId: 'ccpa',           mandatory: true,  weight: 0.7, rationale: 'California consumer privacy law' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.8, rationale: 'Responsible AI governance for credit/risk models' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.6, rationale: 'International ISMS standard' },
    ],
    'united-kingdom': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'UK GDPR (post-Brexit equivalent)' },
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing requirement' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'UK/EU preferred ISMS standard' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'UK AI governance principles for financial services' },
    ],
    'asia-pacific': [
      { frameworkId: 'iso-27001',      mandatory: false, weight: 1.0, rationale: 'Regional ISMS standard' },
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing requirement' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.6, rationale: 'Risk management framework' },
    ],
    'global': [
      { frameworkId: 'iso-27001',      mandatory: false, weight: 1.0, rationale: 'Globally recognized ISMS standard' },
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing requirement' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.8, rationale: 'Globally adopted risk framework' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'Responsible AI for algorithmic decision-making' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.7, rationale: 'International trust assurance' },
    ],
  },
  'insurance': {
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU data protection regulation (mandatory)' },
      { frameworkId: 'eu-ai-act',      mandatory: true,  weight: 0.9, rationale: 'EU AI Act — insurance risk scoring is high-risk AI' },
      { frameworkId: 'cra',            mandatory: false, weight: 0.8, rationale: 'CRA for digital insurance products and platforms' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.8, rationale: 'Responsible AI for actuarial and underwriting models' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'Industry ISMS standard' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.6, rationale: 'Risk management framework' },
    ],
    'north-america': [
      { frameworkId: 'nist-csf',       mandatory: false, weight: 1.0, rationale: 'US cybersecurity standard' },
      { frameworkId: 'hipaa',          mandatory: true,  weight: 0.8, rationale: 'Health insurance data handling' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.8, rationale: 'Customer trust requirement' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'Responsible AI for claims and underwriting decisions' },
      { frameworkId: 'ccpa',           mandatory: false, weight: 0.6, rationale: 'California privacy law' },
    ],
    'global': [
      { frameworkId: 'iso-27001',      mandatory: false, weight: 1.0, rationale: 'Globally recognized ISMS standard' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.8, rationale: 'Globally adopted risk framework' },
    ],
  },
  'healthcare': {
    'north-america': [
      { frameworkId: 'hipaa',          mandatory: true,  weight: 1.0, rationale: 'US federal health privacy law (mandatory)' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.8, rationale: 'HHS recommended framework' },
      { frameworkId: 'nist-800-53',    mandatory: false, weight: 0.6, rationale: 'Detailed control catalog' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'Responsible AI for clinical decision support systems' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.5, rationale: 'Cloud service assurance' },
    ],
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU patient data regulation (mandatory)' },
      { frameworkId: 'eu-ai-act',      mandatory: true,  weight: 1.0, rationale: 'EU AI Act — medical AI is high-risk (Annex III)' },
      { frameworkId: 'cra',            mandatory: true,  weight: 0.9, rationale: 'CRA for connected medical devices and health software' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.8, rationale: 'Responsible AI for clinical and diagnostic AI systems' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'Healthcare ISMS standard' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.5, rationale: 'Risk management best practice' },
    ],
    'global': [
      { frameworkId: 'iso-27001',      mandatory: false, weight: 1.0, rationale: 'Internationally recognized ISMS' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.7, rationale: 'Risk management framework' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.6, rationale: 'Responsible AI for clinical decision support' },
    ],
  },
  'industrial-automation': {
    'global': [
      { frameworkId: 'iec-62443',   mandatory: true,  weight: 1.0, rationale: 'OT/ICS security standard (mandatory for critical infrastructure)' },
      { frameworkId: 'cra',         mandatory: false, weight: 0.8, rationale: 'CRA for connected industrial products sold in EU market' },
      { frameworkId: 'nist-csf',    mandatory: false, weight: 0.7, rationale: 'IT risk management layer' },
      { frameworkId: 'iso-27001',   mandatory: false, weight: 0.5, rationale: 'Corporate IT ISMS' },
    ],
    'north-america': [
      { frameworkId: 'iec-62443',   mandatory: true,  weight: 1.0, rationale: 'OT/ICS security standard' },
      { frameworkId: 'nist-csf',    mandatory: false, weight: 0.8, rationale: 'CISA recommended framework for CI' },
      { frameworkId: 'nist-800-53', mandatory: false, weight: 0.6, rationale: 'Federal control catalog' },
    ],
    'european-union': [
      { frameworkId: 'iec-62443',   mandatory: true,  weight: 1.0, rationale: 'OT/ICS security standard' },
      { frameworkId: 'cra',         mandatory: true,  weight: 1.0, rationale: 'CRA mandatory for connected industrial products placed on EU market' },
      { frameworkId: 'iso-27001',   mandatory: false, weight: 0.7, rationale: 'EU preferred ISMS standard' },
    ],
  },
  'telecom': {
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU data protection regulation' },
      { frameworkId: 'cra',            mandatory: true,  weight: 0.9, rationale: 'CRA for network equipment and connected products' },
      { frameworkId: 'eu-ai-act',      mandatory: false, weight: 0.7, rationale: 'EU AI Act for AI-driven network management' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'Telecom industry ISMS standard' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.6, rationale: 'Risk management framework' },
    ],
    'north-america': [
      { frameworkId: 'nist-csf',    mandatory: false, weight: 1.0, rationale: 'FCC-referenced framework' },
      { frameworkId: 'ccpa',        mandatory: false, weight: 0.6, rationale: 'California subscriber privacy' },
      { frameworkId: 'soc2',        mandatory: false, weight: 0.7, rationale: 'Customer trust assurance' },
    ],
    'global': [
      { frameworkId: 'iso-27001',   mandatory: false, weight: 1.0, rationale: 'Globally recognized ISMS' },
      { frameworkId: 'nist-csf',    mandatory: false, weight: 0.7, rationale: 'Risk management framework' },
    ],
  },
  'digital-media': {
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU data protection regulation (mandatory)' },
      { frameworkId: 'eu-ai-act',      mandatory: true,  weight: 0.9, rationale: 'EU AI Act — recommender systems and deepfake transparency obligations' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.8, rationale: 'Responsible AI for content recommendation and moderation' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.7, rationale: 'Content security standard' },
    ],
    'north-america': [
      { frameworkId: 'ccpa',           mandatory: true,  weight: 1.0, rationale: 'California privacy law' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.9, rationale: 'Partner and customer trust' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'Responsible AI for content recommendation' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.7, rationale: 'Risk management framework' },
    ],
    'global': [
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'Globally recognized ISMS' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'Responsible AI for algorithmic content systems' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.8, rationale: 'Customer trust assurance' },
    ],
  },
  'retail': {
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU customer data regulation (mandatory)' },
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing' },
      { frameworkId: 'cra',            mandatory: false, weight: 0.7, rationale: 'CRA for connected retail products sold in EU' },
      { frameworkId: 'eu-ai-act',      mandatory: false, weight: 0.7, rationale: 'EU AI Act for AI-powered retail and pricing systems' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.7, rationale: 'Retail ISMS standard' },
    ],
    'north-america': [
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing' },
      { frameworkId: 'ccpa',           mandatory: true,  weight: 0.8, rationale: 'California consumer privacy' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.7, rationale: 'Risk management framework' },
      { frameworkId: 'soc2',           mandatory: false, weight: 0.6, rationale: 'E-commerce trust assurance' },
    ],
    'global': [
      { frameworkId: 'pci-dss',        mandatory: true,  weight: 1.0, rationale: 'Card payment processing' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.8, rationale: 'Globally recognized ISMS' },
    ],
  },
  'government': {
    'north-america': [
      { frameworkId: 'nist-800-53',    mandatory: true,  weight: 1.0, rationale: 'FISMA requirement for federal systems' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.9, rationale: 'Executive Order 14028 framework' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.8, rationale: 'Executive Order 13960 on AI in federal agencies' },
      { frameworkId: 'ccpa',           mandatory: false, weight: 0.5, rationale: 'State and local agencies in California' },
    ],
    'european-union': [
      { frameworkId: 'gdpr',           mandatory: true,  weight: 1.0, rationale: 'EU data protection regulation (mandatory)' },
      { frameworkId: 'eu-ai-act',      mandatory: true,  weight: 1.0, rationale: 'EU AI Act — biometric ID and law enforcement AI is high-risk' },
      { frameworkId: 'cra',            mandatory: true,  weight: 0.9, rationale: 'CRA for government digital infrastructure and products' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.9, rationale: 'Responsible AI for public sector automated decisions' },
      { frameworkId: 'iso-27001',      mandatory: false, weight: 0.9, rationale: 'EU government preferred standard' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.5, rationale: 'Risk management best practice' },
    ],
    'global': [
      { frameworkId: 'iso-27001',      mandatory: false, weight: 1.0, rationale: 'Internationally recognized ISMS' },
      { frameworkId: 'nist-csf',       mandatory: false, weight: 0.8, rationale: 'Globally adopted risk framework' },
      { frameworkId: 'responsible-ai', mandatory: false, weight: 0.7, rationale: 'Responsible AI for public sector AI deployments' },
    ],
  },
};

export const REGION_MANDATORY_FRAMEWORKS: Partial<Record<BusinessRegion, FrameworkId[]>> = {
  'european-union': ['gdpr', 'eu-ai-act', 'cra'],
  'united-kingdom': ['gdpr'],
  'north-america': ['ccpa'],
};

export function getApplicableFrameworks(
  businessType: BusinessType,
  region: BusinessRegion
): FrameworkApplicability[] {
  const byType = businessFrameworkMatrix[businessType];
  if (!byType) return [];
  return byType[region] ?? byType['global'] ?? [];
}
