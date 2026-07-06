import { IESIMProvider, ESIMPlan, ActivationResult } from "./IESIMProvider";

export class MockProvider implements IESIMProvider {
  readonly name = "MockProvider";

  private plans: ESIMPlan[] = [
    {
      id: "mock-jp-1gb-7d",
      provider: this.name,
      country: "Japan",
      countryCode: "JP",
      dataBytes: 1_000_000_000n,
      dataDisplay: "1 GB",
      validityDays: 7,
      costUSD: 4.50,
      marginUSD: 1.50,
      priceUSD: 6.00,
    },
    {
      id: "mock-us-5gb-30d",
      provider: this.name,
      country: "United States",
      countryCode: "US",
      dataBytes: 5_000_000_000n,
      dataDisplay: "5 GB",
      validityDays: 30,
      costUSD: 12.00,
      marginUSD: 3.00,
      priceUSD: 15.00,
    },
    {
      id: "mock-de-3gb-14d",
      provider: this.name,
      country: "Germany",
      countryCode: "DE",
      dataBytes: 3_000_000_000n,
      dataDisplay: "3 GB",
      validityDays: 14,
      costUSD: 8.00,
      marginUSD: 2.00,
      priceUSD: 10.00,
    },
    {
      id: "mock-global-1gb-7d",
      provider: this.name,
      country: "Global",
      countryCode: "GL",
      dataBytes: 1_000_000_000n,
      dataDisplay: "1 GB",
      validityDays: 7,
      costUSD: 9.99,
      marginUSD: 3.00,
      priceUSD: 12.99,
    },
  ];

  async listPlans(): Promise<ESIMPlan[]> {
    return this.plans;
  }

  async getPlan(planId: string): Promise<ESIMPlan | null> {
    return this.plans.find((p) => p.id === planId) ?? null;
  }

  async isPlanAvailable(planId: string): Promise<boolean> {
    return this.plans.some((p) => p.id === planId);
  }

  async purchaseAndActivate(planId: string, purchaserEmail: string): Promise<ActivationResult> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 200));

    return {
      success: true,
      activationCode: `MOCK-${planId.toUpperCase().replace(/-/g, "")}-${Date.now().toString(36).toUpperCase()}`,
      qrCodeUrl: `https://api.esim.example/qr/${planId}/${Date.now()}`,
      smdpAddress: "mock.smdp.airalo.com",
      matchingId: `MOCK-MATCH-${Date.now().toString(36)}`,
    };
  }
}
