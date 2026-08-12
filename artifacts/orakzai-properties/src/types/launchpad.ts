export type LaunchType = 'LAUNCHPAD' | 'LAUNCHPOOL' | 'AIRDROP' | 'LOTTERY';
export type ProjectStatus = 'UPCOMING' | 'ACTIVE' | 'CALCULATING' | 'COMPLETED';

export interface BaseProject {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string;
  bannerUrl?: string;
  network: string;
  type: LaunchType;
  status: ProjectStatus;
  description: string;
  website: string;
  whitepaper: string;
  socials: Record<string, string>;
}

export interface LaunchpadProject extends BaseProject {
  type: 'LAUNCHPAD';
  tokenPriceUSD: number;
  totalAllocation: number;
  hardCapUSD: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  distributionDate: string;
  minAllocationToken: number;
  maxAllocationToken: number;
  totalCommittedTokens: number;
  participantCount: number;
}

export interface UserSubscription {
  projectId: string;
  committedAmount: number;
  estimatedTokens: number;
  finalAllocation?: number;
  isClaimed: boolean;
  hasParticipated: boolean;
}
