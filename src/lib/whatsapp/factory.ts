import { IWhatsAppProvider, WhatsAppMode } from "./types";
import { MockWhatsAppProvider } from "./mock-provider";
import { MetaCloudApiProvider } from "./meta-provider";

export class WhatsAppProviderFactory {
  private static mockInstance = new MockWhatsAppProvider();
  private static metaInstance = new MetaCloudApiProvider();

  public static getProvider(mode: WhatsAppMode = "mock"): IWhatsAppProvider {
    if (mode === "live") {
      return this.metaInstance;
    }
    return this.mockInstance;
  }
}
