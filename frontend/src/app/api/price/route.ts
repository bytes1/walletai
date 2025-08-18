export async function GET(req: Request) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const ids = searchParams.get("ids");
    const currencies = searchParams.get("currencies");

    // Validate Parameters
    if (!ids || !currencies) {
      return new Response(JSON.stringify({ error: "Missing required query parameters" }), {
        status: 400,
      });
    }

    // Check Cache
    const { isCached, priceCached } = getFromCache(ids, currencies);
    if (isCached && priceCached) {
      return Response.json(JSON.parse(priceCached)); // Return full cached response
    }

    // Fetch Price Data from CoinGecko
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currencies}`,
    );

    if (!priceResponse.ok) {
      throw new Error(`CoinGecko API Error: ${priceResponse.statusText}`);
    }

    const priceJson = await priceResponse.json();

    // Save to Cache
    saveToCache(ids, currencies, priceJson);

    return Response.json(priceJson); // Return the full response dynamically
  } catch (error) {
    console.error("Error fetching price data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch price data" }), { status: 500 });
  }
}

const cache = new Map();

function saveToCache(
  ids: string | null,
  currencies: string | null,
  priceJson: Response | null,
): void {
  const key = `${ids}-${currencies}`;
  // save to cache
  cache.set(key, JSON.stringify({ ...priceJson, timestamp: Date.now() }));
}

function getFromCache(
  ids: string | null,
  currencies: string | null,
): { isCached: boolean; priceCached: string } {
  try {
    const key = `${ids}-${currencies}`;
    // retrieve from cache
    const priceCached = cache.get(key);
    const priceCachedJson = JSON.parse(priceCached);

    const timestamp = priceCachedJson.timestamp;
    const now = Date.now();
    // cache for 1 minute
    if (now - timestamp > 1 * 60 * 1000) {
      return { isCached: false, priceCached: "" };
    }
    return { isCached: true, priceCached };
  } catch (e) {
    return { isCached: false, priceCached: "" };
  }
}
