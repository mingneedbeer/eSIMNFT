export interface ESIMPlan {
  id: string;
  provider: string;
  country: string;
  countryCode: string;
  dataBytes: bigint;
  dataDisplay: string;
  validityDays: number;
  costUSD: number;
  marginUSD: number;
  priceUSD: number;
}

export interface ActivationResult {
  success: boolean;
  activationCode: string;
  qrCodeUrl?: string;
  smdpAddress?: string;
  matchingId?: string;
  confirmationCode?: string;
}

export interface IESIMProvider {
  readonly name: string;

  /** List available eSIM plans */
  listPlans(): Promise<ESIMPlan[]>;

  /** Get a specific plan by ID */
  getPlan(planId: string): Promise<ESIMPlan | null>;

  /** Purchase and activate an eSIM plan. Returns activation details */
  purchaseAndActivate(planId: string, purchaserEmail: string): Promise<ActivationResult>;

  /** Check if a plan is available for purchase */
  isPlanAvailable(planId: string): Promise<boolean>;
}
