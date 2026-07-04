import { prisma } from "@/lib/db/prisma";
import { importTrendingProducts } from "@/lib/agents/product-importer";
import { generateSyntheticCatalog } from "@/lib/agents/synthetic-catalog";
import { runEconomist } from "@/lib/agents/economist";
import { huntProductImages } from "@/lib/agents/image-hunter";
import { generateArticle } from "@/lib/agents/article-generator";
import { generateTravelPackages } from "@/lib/agents/travel-agent";
import type { AgentResult } from "@/types";

export abstract class BaseAgent {
  name: string;
  schedule: string;
  description: string;

  constructor(name: string, schedule: string, description: string) {
    this.name = name;
    this.schedule = schedule;
    this.description = description;
  }

  abstract execute(): Promise<AgentResult>;

  async log(action: string, status: "success" | "warning" | "error", details?: Record<string, unknown>) {
    await prisma.agentLog.create({
      data: {
        agent: this.name,
        action,
        status,
        details: (details || {}) as any,
      },
    });
  }

  async run(): Promise<AgentResult> {
    try {
      const result = await this.execute();
      await this.log(result.action, result.status, result.details);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await this.log("run", "error", { error: message });
      return {
        agent: this.name,
        action: "run",
        status: "error",
        details: { error: message },
      };
    }
  }
}

// Agent Runner - executes all agents
export async function runAgent(agentName: string): Promise<AgentResult> {
  const agents: Record<string, BaseAgent> = {
    travel_agent: new TravelAgent(),
    image_hunter: new ImageHunterAgent(),
    article_generator: new ArticleGeneratorAgent(),
    economist: new EconomistAgent(),
    curator: new CatalogCurator(),
    product_importer: new ProductImporterAgent(),
    trend_hunter: new TrendHunter(),
    promoter: new PromotionGenerator(),
    events_director: new EventDirector(),
    mail_carrier: new MailCarrier(),
    optimizer: new Optimizer(),
  };

  const agent = agents[agentName];
  if (!agent) {
    return {
      agent: agentName,
      action: "run",
      status: "error",
      details: { error: `Agent "${agentName}" not found` },
    };
  }

  return agent.run();
}

export async function runAllAgents(): Promise<AgentResult[]> {
  const results: AgentResult[] = [];
  const agentNames = ["curator", "trend_hunter", "promoter", "events_director", "mail_carrier", "optimizer"];

  for (const name of agentNames) {
    try {
      const result = await runAgent(name);
      results.push(result);
    } catch (error) {
      results.push({
        agent: name,
        action: "run",
        status: "error",
        details: { error: String(error) },
      });
    }
  }

  return results;
}

// ─── Agent Implementations ───

/**
 * Agente Curador de Catálogo - CORAZÓN AUTÓNOMO DEL SISTEMA.
 * 
 * Cada 6 horas:
 *   - Si MercadoLibre API está configurada: importa tendencias reales con imágenes
 *   - Si no: genera catálogo sintético realista con rotación diaria
 * 
 * Descarga imágenes, copia descripciones, actualiza precios.
 */
class CatalogCurator extends BaseAgent {
  constructor() {
    super(
      "curator",
      "0 */6 * * *",
      "Busca tendencias y actualiza el catálogo (ML o sintético)"
    );
  }

  async execute(): Promise<AgentResult> {
    const hasMLCredentials = !!(process.env.MERCADO_LIBRE_APP_ID && process.env.MERCADO_LIBRE_CLIENT_SECRET);

    if (hasMLCredentials) {
      return await this.executeMLImport();
    } else {
      return await this.executeSyntheticGeneration();
    }
  }

  private async executeMLImport(): Promise<AgentResult> {
    console.log("[Curator] Using MercadoLibre API...");

    try {
      const result = await importTrendingProducts({
        mode: "all_categories",
        maxProducts: 150,
        minSold: 10,
        downloadImages: true,
      });

      const risingResult = await importTrendingProducts({
        mode: "rising",
        maxProducts: 30,
        minSold: 5,
        downloadImages: true,
      });

      const totalImported = result.imported + risingResult.imported;
      const totalUpdated = result.updated + risingResult.updated;

      // Si ML no trajo nada, caer a sintético
      if (totalImported === 0) {
        console.log("[Curator] ML returned 0 products, falling back to synthetic");
        return this.executeSyntheticGeneration();
      }

      return {
        agent: this.name,
        action: "sync_catalog_ml",
        status: totalUpdated > 0 ? "success" : "warning",
        details: {
          imported: totalImported,
          updated: totalUpdated,
          skipped: result.skipped + risingResult.skipped,
          errors: result.errors + risingResult.errors,
          totalInCatalog: result.productsInCatalog,
          imagesDownloaded: result.imagesDownloaded + risingResult.imagesDownloaded,
          source: "mercadolibre",
        },
      };
    } catch (error) {
      console.error("[Curator] ML import failed, falling back to synthetic:", error);
      return this.executeSyntheticGeneration();
    }
  }

  private async executeSyntheticGeneration(): Promise<AgentResult> {
    console.log("[Curator] ML no disponible. Generando catálogo sintético...");

    try {
      const result = await generateSyntheticCatalog({
        count: 40,
        forceUpdate: false,
        variationPct: 0.05,
      });

      return {
        agent: this.name,
        action: "generate_synthetic",
        status: result.imported > 0 ? "success" : "warning",
        details: {
          imported: result.imported,
          updated: result.updated,
          skipped: result.skipped,
          totalInCatalog: result.totalActive,
          source: "synthetic",
          message: "MercadoLibre no configurado. Catálogo sintético activo. Configura ML_API en /admin/config para productos reales.",
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        action: "generate_synthetic",
        status: "error",
        details: { error: String(error) },
      };
    }
  }
}

/**
 * Agente Importador de Productos - Ejecución bajo demanda.
 * Permite importar con modos específicos.
 */
class ProductImporterAgent extends BaseAgent {
  constructor() {
    super(
      "product_importer",
      "0 */12 * * *",
      "Importación masiva de productos desde APIs de afiliados y ML"
    );
  }

  async execute(): Promise<AgentResult> {
    console.log("[ProductImporter] Starting targeted import...");

    try {
      // Importar tops ventas
      const topResult = await importTrendingProducts({
        mode: "top_selling",
        maxProducts: 50,
        minSold: 200,
        downloadImages: true,
      });

      return {
        agent: this.name,
        action: "import_products",
        status: topResult.imported > 0 ? "success" : "warning",
        details: {
          imported: topResult.imported,
          updated: topResult.updated,
          skipped: topResult.skipped,
          totalInCatalog: topResult.productsInCatalog,
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        action: "import_products",
        status: "error",
        details: { error: String(error) },
      };
    }
  }
}

class TrendHunter extends BaseAgent {
  constructor() {
    super(
      "trend_hunter",
      "0 8 * * *",
      "Detecta productos con ranking de ventas en alza"
    );
  }

  async execute(): Promise<AgentResult> {
    const trendingProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldQuantity: "desc" },
      take: 10,
    });

    // Mark top products as featured
    for (const product of trendingProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          tags: {
            set: [...product.tags.filter((t) => t !== "trending"), "trending"],
          },
        },
      });
    }

    // Unmark old trending
    await prisma.product.updateMany({
      where: {
        tags: { has: "trending" },
        id: { notIn: trendingProducts.map((p) => p.id) },
      },
      data: {
        tags: {
          set: [],
        },
      },
    });

    return {
      agent: this.name,
      action: "update_trends",
      status: "success",
      details: { trendingCount: trendingProducts.length },
    };
  }
}

class PromotionGenerator extends BaseAgent {
  constructor() {
    super(
      "promoter",
      "0 9 * * *",
      "Genera ofertas flash, packs temáticos y descuentos del juego"
    );
  }

  async execute(): Promise<AgentResult> {
    const promotions = await prisma.promotion.findMany({
      where: {
        endsAt: { gte: new Date() },
        isActive: true,
      },
    });

    // Clean expired promotions
    const expired = await prisma.promotion.updateMany({
      where: {
        endsAt: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });

    return {
      agent: this.name,
      action: "generate_promotions",
      status: "success",
      details: {
        activeCount: promotions.length,
        expiredDisabled: expired.count,
      },
    };
  }
}

/**
 * Agente Economista - Ajusta precios y factores de moneda para LatAm.
 * Cada 24h analiza el mercado y mantiene la economía del juego balanceada
 * entre los distintos países.
 */
class EconomistAgent extends BaseAgent {
  constructor() {
    super(
      "economist",
      "0 6 * * *",
      "Ajusta factores de moneda y mantiene precios regionales balanceados"
    );
  }

  async execute(): Promise<AgentResult> {
    try {
      const result = await runEconomist();
      return {
        agent: this.name,
        action: "market_analysis",
        status: "success",
        details: {
          countriesProcessed: result.countriesProcessed,
          factorsApplied: result.factorsApplied,
          pricesGenerated: result.pricesGenerated,
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        action: "market_analysis",
        status: "error",
        details: { error: String(error) },
      };
    }
  }
}

class EventDirector extends BaseAgent {
  constructor() {
    super(
      "events_director",
      "0 10 * * 1",
      "Programa eventos grandes replicando calendario retail chileno"
    );
  }

  async execute(): Promise<AgentResult> {
    const activeEvents = await prisma.gameEvent.findMany({
      where: {
        endsAt: { gte: new Date() },
        isActive: true,
      },
    });

    const expired = await prisma.gameEvent.updateMany({
      where: {
        endsAt: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });

    return {
      agent: this.name,
      action: "manage_events",
      status: "success",
      details: {
        activeEvents: activeEvents.length,
        expiredDisabled: expired.count,
      },
    };
  }
}

class MailCarrier extends BaseAgent {
  constructor() {
    super(
      "mail_carrier",
      "0 11 * * *",
      "Envía correos personalizados según segmentos de usuarios"
    );
  }

  async execute(): Promise<AgentResult> {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return {
        agent: this.name,
        action: "send_campaign",
        status: "warning",
        details: {
          message: "Resend API no configurada. Emails desactivados.",
          sentCount: 0,
        },
      };
    }

    // Get active users with email
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        emailVerified: { not: null },
      },
      include: { emailPrefs: true },
    });

    const optedIn = users.filter(
      (u) => u.emailPrefs?.offers !== false
    );

    return {
      agent: this.name,
      action: "send_campaign",
      status: "success",
      details: {
        totalUsers: users.length,
        optedIn: optedIn.length,
        sentCount: 0, // Would send on actual implementation
      },
    };
  }
}

/**
 * Image Hunter Agent - Busca imágenes reales en Google Images + Paris.cl
 * Cada 24h recorre los productos buscando mejorar sus imágenes.
 */
class ImageHunterAgent extends BaseAgent {
  constructor() {
    super(
      "image_hunter",
      "0 4 * * *",
      "Busca imágenes reales de productos en Google Images y Paris.cl"
    );
  }

  async execute(): Promise<AgentResult> {
    try {
      const result = await huntProductImages();
      return {
        agent: this.name,
        action: "hunt_images",
        status: "success",
        details: {
          total: result.total,
          updated: result.updated,
          fromParis: result.fromParis,
          fromGoogle: result.fromGoogle,
          errors: result.errors,
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        action: "hunt_images",
        status: "error",
        details: { error: String(error) },
      };
    }
  }
}

class Optimizer extends BaseAgent {
  constructor() {
    super(
      "optimizer",
      "0 12 * * 0",
      "Analiza métricas y ajusta parámetros del juego semanalmente"
    );
  }

  async execute(): Promise<AgentResult> {
    // Collect weekly analytics
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600000);

    const [totalUsers, newUsers, totalOrders, totalSpins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      prisma.spin.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
    ]);

    return {
      agent: this.name,
      action: "weekly_optimization",
      status: "success",
      details: {
        period: oneWeekAgo.toISOString(),
        totalUsers,
        newUsers,
        totalOrders,
        totalSpins,
        report: {
          growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) + "%" : "0%",
          ordersPerUser: totalUsers > 0 ? (totalOrders / totalUsers).toFixed(2) : "0",
        },
      },
    };
  }
}

/**
 * Travel Agent - Genera paquetes de viaje atractivos semanalmente.
 */
class TravelAgent extends BaseAgent {
  constructor() {
    super(
      "travel_agent",
      "0 4 * * 3",
      "Genera paquetes turísticos atractivos para Latinoamérica"
    );
  }

  async execute(): Promise<AgentResult> {
    try {
      const count = await generateTravelPackages(3);
      return {
        agent: this.name,
        action: "generate_travel_packages",
        status: count > 0 ? "success" : "warning",
        details: { created: count },
      };
    } catch (error) {
      return {
        agent: this.name,
        action: "generate_travel_packages",
        status: "error",
        details: { error: String(error) },
      };
    }
  }
}

/**
 * Article Generator Agent - Crea artículos de estilo de vida semanalmente.
 */
class ArticleGeneratorAgent extends BaseAgent {
  constructor() {
    super(
      "article_generator",
      "0 5 * * 1",
      "Genera un artículo semanal sobre tendencias, estilo de vida y compras"
    );
  }

  async execute(): Promise<AgentResult> {
    try {
      const result = await generateArticle();
      return {
        agent: this.name,
        action: "generate_article",
        status: result.success ? "success" : "warning",
        details: {
          title: result.title,
          slug: result.slug,
          message: result.success
            ? "Artículo creado exitosamente"
            : "El artículo ya existía o no se pudo crear",
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        action: "generate_article",
        status: "error",
        details: { error: String(error) },
      };
    }
  }
}
