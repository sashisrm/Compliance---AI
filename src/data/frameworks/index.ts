import { nistCsf } from './nist-csf';
import { iso27001 } from './iso-27001';
import { gdpr } from './gdpr';
import { pciDss } from './pci-dss';
import { iec62443 } from './iec-62443';
import { hipaa } from './hipaa';
import { soc2 } from './soc2';
import { nist80053 } from './nist-800-53';
import { ccpa } from './ccpa';
import { responsibleAi } from './responsible-ai';
import { euAiAct } from './eu-ai-act';
import { cra } from './cra';
import type { Framework } from '../../types/frameworks';
import type { FrameworkId } from '../../types/filters';

export const ALL_FRAMEWORKS: Framework[] = [
  nistCsf,
  nist80053,
  iso27001,
  gdpr,
  pciDss,
  iec62443,
  hipaa,
  soc2,
  ccpa,
  responsibleAi,
  euAiAct,
  cra,
];

export const FRAMEWORK_MAP: Record<FrameworkId, Framework> = {
  'nist-csf': nistCsf,
  'nist-800-53': nist80053,
  'iso-27001': iso27001,
  'iso-27002': iso27001, // mapped to 27001 for simplicity
  'gdpr': gdpr,
  'pci-dss': pciDss,
  'iec-62443': iec62443,
  'hipaa': hipaa,
  'soc2': soc2,
  'ccpa': ccpa,
  'responsible-ai': responsibleAi,
  'eu-ai-act': euAiAct,
  'cra': cra,
};

export { nistCsf, nist80053, iso27001, gdpr, pciDss, iec62443, hipaa, soc2, ccpa, responsibleAi, euAiAct, cra };
