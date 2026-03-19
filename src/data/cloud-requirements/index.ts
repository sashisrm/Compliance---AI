import type { CloudProvider } from '../../types/filters';
import type { ControlSeverity } from '../../types/frameworks';

export interface CloudRequirement {
  id: string;
  provider: CloudProvider;
  service: string;
  title: string;
  description: string;
  severity: ControlSeverity;
  frameworkMappings: string[];
  remediationSteps: string[];
}

export const cloudRequirements: CloudRequirement[] = [
  // AWS Requirements
  {
    id: 'AWS-IAM-001',
    provider: 'aws',
    service: 'IAM',
    title: 'MFA enabled for all IAM users with console access',
    description: 'All AWS IAM users with console access must have MFA enabled to protect against credential compromise.',
    severity: 'critical',
    frameworkMappings: ['NIST-CSF-PR.AA-01', 'NIST-800-53-IA-2', 'ISO-27001-A.8.1'],
    remediationSteps: [
      'Enable MFA for all IAM users in the AWS console',
      'Enforce via SCP: deny console access without MFA',
      'Use AWS Config rule: iam-user-mfa-enabled',
      'Consider hardware MFA for privileged accounts',
    ],
  },
  {
    id: 'AWS-IAM-002',
    provider: 'aws',
    service: 'IAM',
    title: 'Root account MFA and restricted usage',
    description: 'AWS root account must have MFA enabled and should not be used for routine operations.',
    severity: 'critical',
    frameworkMappings: ['NIST-CSF-PR.AA-01', 'PCI-8.3.6'],
    remediationSteps: [
      'Enable hardware MFA on root account',
      'Remove root account access keys',
      'Use root account only for tasks that require it',
      'Set up CloudWatch alerts for root account usage',
    ],
  },
  {
    id: 'AWS-S3-001',
    provider: 'aws',
    service: 'S3',
    title: 'S3 buckets with public access blocked',
    description: 'All S3 buckets should have public access blocked unless explicitly required for static website hosting.',
    severity: 'critical',
    frameworkMappings: ['NIST-CSF-PR.DS-01', 'ISO-27001-A.5.15'],
    remediationSteps: [
      'Enable S3 Block Public Access at account level',
      'Review and remediate any buckets with public access',
      'Use AWS Config rule: s3-bucket-public-read-prohibited',
      'Implement S3 bucket policy to deny public access',
    ],
  },
  {
    id: 'AWS-S3-002',
    provider: 'aws',
    service: 'S3',
    title: 'S3 bucket encryption at rest enabled',
    description: 'All S3 buckets storing sensitive data must have server-side encryption enabled.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-PR.DS-01', 'GDPR-Art.32', 'PCI-3.5.1'],
    remediationSteps: [
      'Enable default encryption on all S3 buckets (AES-256 or KMS)',
      'Use AWS Config rule: s3-bucket-server-side-encryption-enabled',
      'Consider customer-managed KMS keys for sensitive workloads',
    ],
  },
  {
    id: 'AWS-CLOUDTRAIL-001',
    provider: 'aws',
    service: 'CloudTrail',
    title: 'CloudTrail enabled in all regions',
    description: 'AWS CloudTrail must be enabled in all regions to capture all API activity.',
    severity: 'high',
    frameworkMappings: ['ISO-27001-A.8.15', 'NIST-800-53-AU-2', 'PCI-10.2.1'],
    remediationSteps: [
      'Enable multi-region CloudTrail trail',
      'Enable CloudTrail log file validation',
      'Send CloudTrail logs to centralized S3 bucket with restricted access',
      'Enable CloudWatch Logs integration for real-time monitoring',
    ],
  },
  {
    id: 'AWS-GUARDDUTY-001',
    provider: 'aws',
    service: 'GuardDuty',
    title: 'Amazon GuardDuty enabled',
    description: 'GuardDuty should be enabled to provide intelligent threat detection across all accounts.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-DE.CM-01', 'SOC2-CC7.2'],
    remediationSteps: [
      'Enable GuardDuty in all regions and member accounts',
      'Configure GuardDuty findings export to S3',
      'Integrate GuardDuty with SIEM for centralized alerting',
      'Set up automated remediation for common findings',
    ],
  },
  {
    id: 'AWS-VPC-001',
    provider: 'aws',
    service: 'VPC',
    title: 'VPC Flow Logs enabled',
    description: 'VPC Flow Logs must be enabled to capture all network traffic for security analysis.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-DE.CM-01', 'PCI-10.2.1', 'ISO-27001-A.8.15'],
    remediationSteps: [
      'Enable VPC Flow Logs for all VPCs',
      'Send flow logs to CloudWatch Logs or S3',
      'Integrate with SIEM for network traffic analysis',
      'Retain flow logs for minimum 90 days',
    ],
  },
  {
    id: 'AWS-KMS-001',
    provider: 'aws',
    service: 'KMS',
    title: 'Customer-managed KMS keys for sensitive data',
    description: 'Customer-managed KMS keys should be used for sensitive data to maintain key control.',
    severity: 'medium',
    frameworkMappings: ['ISO-27001-A.8.24', 'NIST-CSF-PR.DS-01', 'PCI-3.5.1'],
    remediationSteps: [
      'Create customer-managed KMS keys for sensitive workloads',
      'Enable automatic key rotation annually',
      'Restrict key usage to specific IAM principals',
      'Enable CloudTrail logging for all KMS API calls',
    ],
  },
  // Azure Requirements
  {
    id: 'AZ-AAD-001',
    provider: 'azure',
    service: 'Azure AD',
    title: 'Azure AD MFA enabled for all users',
    description: 'MFA must be enforced for all Azure AD users using Conditional Access policies.',
    severity: 'critical',
    frameworkMappings: ['NIST-CSF-PR.AA-01', 'ISO-27001-A.5.15', 'NIST-800-53-IA-2'],
    remediationSteps: [
      'Configure Azure AD Conditional Access MFA policy',
      'Enforce MFA for all cloud app access',
      'Enable Microsoft Authenticator for passwordless options',
      'Monitor MFA registration status and non-compliant accounts',
    ],
  },
  {
    id: 'AZ-STORAGE-001',
    provider: 'azure',
    service: 'Storage',
    title: 'Azure Storage encryption enabled',
    description: 'All Azure Storage accounts must use encryption at rest with Microsoft-managed or customer-managed keys.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-PR.DS-01', 'GDPR-Art.32', 'ISO-27001-A.8.24'],
    remediationSteps: [
      'Verify encryption at rest is enabled (enabled by default)',
      'Consider customer-managed keys in Azure Key Vault for sensitive workloads',
      'Enable Azure Storage secure transfer required setting',
      'Review storage account network access rules',
    ],
  },
  {
    id: 'AZ-DEFENDER-001',
    provider: 'azure',
    service: 'Microsoft Defender',
    title: 'Microsoft Defender for Cloud enabled',
    description: 'Microsoft Defender for Cloud should be enabled to provide security posture management and threat protection.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-DE.CM-01', 'SOC2-CC7.2', 'ISO-27001-A.8.8'],
    remediationSteps: [
      'Enable Microsoft Defender for Cloud with Enhanced Security Features',
      'Enable all Defender plans appropriate for workloads',
      'Review and remediate Secure Score recommendations',
      'Configure alert notifications and SIEM integration',
    ],
  },
  {
    id: 'AZ-MONITOR-001',
    provider: 'azure',
    service: 'Azure Monitor',
    title: 'Azure Activity Log exported to Log Analytics',
    description: 'Azure Activity Log must be exported to Log Analytics Workspace for security monitoring.',
    severity: 'high',
    frameworkMappings: ['ISO-27001-A.8.15', 'NIST-800-53-AU-2', 'PCI-10.2.1'],
    remediationSteps: [
      'Create diagnostic settings to export Activity Logs to Log Analytics',
      'Configure Azure Sentinel (SIEM) for advanced threat detection',
      'Set up alerts for suspicious management plane activities',
      'Retain logs for minimum 90 days in hot storage',
    ],
  },
  // GCP Requirements
  {
    id: 'GCP-IAM-001',
    provider: 'gcp',
    service: 'Cloud IAM',
    title: 'GCP MFA/2SV enforced for all users',
    description: 'Two-step verification (2SV) must be enforced for all Google Workspace and GCP users.',
    severity: 'critical',
    frameworkMappings: ['NIST-CSF-PR.AA-01', 'ISO-27001-A.5.15'],
    remediationSteps: [
      'Enforce 2SV in Google Admin Console for all users',
      'Require security keys for highly privileged accounts',
      'Use Google Cloud Identity for centralized IAM management',
      'Monitor 2SV enrollment with admin reports',
    ],
  },
  {
    id: 'GCP-LOGGING-001',
    provider: 'gcp',
    service: 'Cloud Logging',
    title: 'Cloud Audit Logs enabled for all services',
    description: 'Admin Activity and Data Access Audit Logs must be enabled across all GCP services.',
    severity: 'high',
    frameworkMappings: ['ISO-27001-A.8.15', 'NIST-800-53-AU-2', 'PCI-10.2.1'],
    remediationSteps: [
      'Enable Data Access Audit Logs for all services in organization policy',
      'Export audit logs to Cloud Storage for long-term retention',
      'Integrate with Security Command Center for threat detection',
      'Configure log-based alerts for suspicious activity',
    ],
  },
  {
    id: 'GCP-SCC-001',
    provider: 'gcp',
    service: 'Security Command Center',
    title: 'Security Command Center Premium enabled',
    description: 'Security Command Center Premium should be enabled for threat detection and security posture management.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-DE.CM-01', 'SOC2-CC7.2'],
    remediationSteps: [
      'Enable Security Command Center at organization level',
      'Configure Tier 2 (Premium) for advanced threat detection',
      'Integrate with SIEM for centralized alerting',
      'Review and remediate Security Health Analytics findings',
    ],
  },
  // Hybrid Requirements
  {
    id: 'HYBRID-CONNECTIVITY-001',
    provider: 'hybrid',
    service: 'Connectivity',
    title: 'Encrypted connectivity between on-premise and cloud',
    description: 'All connectivity between on-premise environments and cloud providers must be encrypted using IPSec VPN or private connectivity.',
    severity: 'critical',
    frameworkMappings: ['NIST-CSF-PR.DS-02', 'ISO-27001-A.8.24', 'PCI-4.2.1'],
    remediationSteps: [
      'Implement AWS Direct Connect, Azure ExpressRoute, or GCP Interconnect',
      'If using internet-based connectivity, implement IPSec VPN',
      'Enforce encryption for all hybrid connectivity (TLS/IPSec)',
      'Monitor and alert on unusual traffic volumes across hybrid links',
    ],
  },
  {
    id: 'HYBRID-IAM-001',
    provider: 'hybrid',
    service: 'Identity',
    title: 'Unified identity management across hybrid environment',
    description: 'A unified identity management solution should extend from on-premise Active Directory to cloud environments.',
    severity: 'high',
    frameworkMappings: ['NIST-CSF-PR.AA-01', 'ISO-27001-A.5.15', 'NIST-800-53-AC-2'],
    remediationSteps: [
      'Implement Azure AD Connect or equivalent for directory synchronization',
      'Enforce consistent MFA policies across all environments',
      'Implement Privileged Identity Management (PIM) for hybrid admin access',
      'Conduct unified access reviews covering all environments',
    ],
  },
];

export function getCloudRequirements(providers: CloudProvider[]): CloudRequirement[] {
  return cloudRequirements.filter(r => providers.includes(r.provider));
}
