import { NextResponse } from 'next/server';
import { COUNTRIES, CountryStats, GlobeData, TalentAPIResponse, BuilderProfile } from '@/types';

const TALENT_API_BASE = 'https://api.talentprotocol.com';
const BUILDERS_FOR_RANKING = 100; // Fetch top 100 to calculate country score
const BUILDERS_FOR_MODAL = 100; // Show top 100 in modal
const PER_PAGE = 250;

// Calculate country score based on top builders' scores
// Uses average score of top N builders (weighted towards having more high-scoring builders)
function calculateCountryScore(profiles: BuilderProfile[]): number {
  if (profiles.length === 0) return 0;
  
  // Sum of all builder scores (points)
  const totalScore = profiles.reduce((sum, p) => {
    const score = p.builder_score?.points || 0;
    return sum + score;
  }, 0);
  
  // Average score of top builders (rounded)
  return Math.round(totalScore / profiles.length);
}

// Build the query for country search - ONLY use standardized_location to avoid duplicates
function buildCountryQuery(countryName: string) {
  return {
    customQuery: {
      regexp: {
        standardized_location: {
          value: `.*${countryName.toLowerCase()}.*`,
          case_insensitive: true
        }
      }
    },
    humanCheckmark: true
  };
}

// Helper to create fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Get ONLY the total count for a country (fast - no profiles returned)
async function getCountryBuilderCount(
  countryName: string,
  apiKey: string,
  retries: number = 2
): Promise<number> {
  const query = buildCountryQuery(countryName);

  const params = new URLSearchParams();
  params.append('query', JSON.stringify(query));
  params.append('returnItems', 'false');
  params.append('page', '1');
  params.append('per_page', '1');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${TALENT_API_BASE}/search/advanced/profiles?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': apiKey,
          },
        },
        15000
      );

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        return 0;
      }

      const data: TalentAPIResponse = await response.json();
      return data.pagination?.total || 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error getting count for ${countryName} (attempt ${attempt}): ${errorMsg}`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return 0;
    }
  }
  return 0;
}

// Fetch builders for a country, sorted by score
async function fetchBuildersPage(
  countryName: string,
  apiKey: string,
  page: number = 1,
  perPage: number = PER_PAGE,
  retries: number = 2
): Promise<{ profiles: BuilderProfile[]; total: number }> {
  const query = buildCountryQuery(countryName);

  // Sort by score descending
  const sort = {
    score: { order: 'desc' },
    id: { order: 'desc' }
  };

  const params = new URLSearchParams();
  params.append('query', JSON.stringify(query));
  params.append('sort', JSON.stringify(sort));
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${TALENT_API_BASE}/search/advanced/profiles?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': apiKey,
          },
        },
        20000
      );

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        return { profiles: [], total: 0 };
      }

      const data: TalentAPIResponse = await response.json();
      return { profiles: data.profiles || [], total: data.pagination?.total || 0 };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching builders for ${countryName} page ${page} (attempt ${attempt}): ${errorMsg}`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return { profiles: [], total: 0 };
    }
  }
  
  return { profiles: [], total: 0 };
}

// Fetch top N builders for a country
async function fetchTopBuilders(
  countryName: string,
  apiKey: string,
  maxBuilders: number = BUILDERS_FOR_RANKING
): Promise<{ profiles: BuilderProfile[]; total: number }> {
  // For 100 builders, we only need 1 page of 100
  const { profiles, total } = await fetchBuildersPage(countryName, apiKey, 1, Math.min(maxBuilders, PER_PAGE));
  return { 
    profiles: profiles.slice(0, maxBuilders), 
    total 
  };
}

export async function GET(request: Request) {
  const apiKey = process.env.TALENT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');

  // Fetch detailed builders for modal (top 100)
  if (countryCode) {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    console.log(`Fetching top ${BUILDERS_FOR_MODAL} builders for ${country.name}...`);
    
    const { profiles, total } = await fetchBuildersPage(country.name, apiKey, 1, BUILDERS_FOR_MODAL);
    
    console.log(`Fetched ${profiles.length} builders for ${country.name} (total: ${total})`);
    
    return NextResponse.json({
      country: country.name,
      countryCode: country.code,
      total,
      builders: profiles.map(p => ({
        id: p.id,
        name: p.display_name || p.name || 'Anonymous',
        bio: p.bio || '',
        rank: p.builder_score?.rank_position || null,
        score: p.builder_score?.points || 0,
        image_url: p.image_url || '',
        location: p.location || '',
        tags: p.tags || [],
        human_checkmark: p.human_checkmark,
        relative_path: p.relative_path || ''
      }))
    });
  }

  // Fetch aggregate data for all countries
  const majorCountries = COUNTRIES.filter(c => 
    ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'JP', 'CN', 'CA', 'AU', 
     'ES', 'IT', 'NL', 'PT', 'PL', 'UA', 'NG', 'KE', 'ZA', 'AR',
     'MX', 'CO', 'CL', 'PE', 'SG', 'KR', 'ID', 'TH', 'VN', 'PH',
     'TR', 'AE', 'IL', 'EG', 'MA', 'SE', 'NO', 'DK', 'FI', 'CH',
     'AT', 'BE', 'IE', 'CZ', 'RO', 'GR', 'HU', 'RU', 'PK', 'BD'].includes(c.code)
  );

  const countryStats: CountryStats[] = [];
  let totalBuilders = 0;
  let maxBuilderCount = 0;
  let maxRankScore = 0;

  console.log(`Fetching builder data for ${majorCountries.length} countries...`);

  // Process countries in batches
  const batchSize = 5;
  for (let i = 0; i < majorCountries.length; i += batchSize) {
    const batch = majorCountries.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (country) => {
        // Step 1: Get total count (fast)
        const totalCount = await getCountryBuilderCount(country.name, apiKey);
        
        if (totalCount === 0) {
          return { country, totalCount: 0, profiles: [], avgScore: 0 };
        }
        
        // Step 2: Fetch top 100 builders for score calculation
        const { profiles } = await fetchTopBuilders(country.name, apiKey, BUILDERS_FOR_RANKING);
        
        // Step 3: Calculate country score (average of top builders' scores)
        const avgScore = calculateCountryScore(profiles);
        
        return { country, totalCount, profiles, avgScore };
      })
    );

    for (const result of results) {
      const { country, totalCount, profiles, avgScore } = result;
      
      console.log(`${country.name}: ${totalCount} builders, avg score: ${avgScore}`);
      
      if (totalCount > 0) {
        const stats: CountryStats = {
          country: country.name,
          countryCode: country.code,
          builderCount: totalCount,
          rankScore: avgScore, // Now using average score of top builders
          rankedBuilders: profiles.length, // How many builders we used for calculation
          topBuilders: profiles.slice(0, 5).map(p => ({
            name: p.display_name || p.name || 'Anonymous',
            rank: p.builder_score?.rank_position || null,
            score: p.builder_score?.points || 0,
            image_url: p.image_url || ''
          }))
        };

        countryStats.push(stats);
        totalBuilders += totalCount;
        maxBuilderCount = Math.max(maxBuilderCount, totalCount);
        maxRankScore = Math.max(maxRankScore, avgScore);
      }
    }

    if (i + batchSize < majorCountries.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`Total: ${totalBuilders} builders across ${countryStats.length} countries`);

  // Sort by average score (highest first), then by builder count
  const globeData: GlobeData = {
    countries: countryStats.sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      return b.builderCount - a.builderCount;
    }),
    totalBuilders,
    maxBuilderCount: Math.max(1, maxBuilderCount),
    maxRankScore: Math.max(1, maxRankScore)
  };

  return NextResponse.json(globeData);
}

// Streaming endpoint for progress updates
export async function POST() {
  const apiKey = process.env.TALENT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const majorCountries = COUNTRIES.filter(c => 
    ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'JP', 'CN', 'CA', 'AU', 
     'ES', 'IT', 'NL', 'PT', 'PL', 'UA', 'NG', 'KE', 'ZA', 'AR',
     'MX', 'CO', 'CL', 'PE', 'SG', 'KR', 'ID', 'TH', 'VN', 'PH',
     'TR', 'AE', 'IL', 'EG', 'MA', 'SE', 'NO', 'DK', 'FI', 'CH',
     'AT', 'BE', 'IE', 'CZ', 'RO', 'GR', 'HU', 'RU', 'PK', 'BD'].includes(c.code)
  );

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const countryStats: CountryStats[] = [];
      let totalBuilders = 0;
      let maxBuilderCount = 0;
      let maxRankScore = 0;

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'start',
        totalCountries: majorCountries.length
      })}\n\n`));

      const batchSize = 5;
      for (let i = 0; i < majorCountries.length; i += batchSize) {
        const batch = majorCountries.slice(i, i + batchSize);
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          current: i,
          total: majorCountries.length,
          countries: batch.map(c => c.name),
          percentage: Math.round((i / majorCountries.length) * 100)
        })}\n\n`));

        const results = await Promise.all(
          batch.map(async (country) => {
            const totalCount = await getCountryBuilderCount(country.name, apiKey);
            
            if (totalCount === 0) {
              return { country, totalCount: 0, profiles: [], avgScore: 0 };
            }
            
            const { profiles } = await fetchTopBuilders(country.name, apiKey, BUILDERS_FOR_RANKING);
            
            // Calculate average score of top builders
            const avgScore = calculateCountryScore(profiles);
            
            return { country, totalCount, profiles, avgScore };
          })
        );

        for (const result of results) {
          const { country, totalCount, profiles, avgScore } = result;
          
          if (totalCount > 0) {
            const stats: CountryStats = {
              country: country.name,
              countryCode: country.code,
              builderCount: totalCount,
              rankScore: avgScore,
              rankedBuilders: profiles.length,
              topBuilders: profiles.slice(0, 5).map(p => ({
                name: p.display_name || p.name || 'Anonymous',
                rank: p.builder_score?.rank_position || null,
                score: p.builder_score?.points || 0,
                image_url: p.image_url || ''
              }))
            };

            countryStats.push(stats);
            totalBuilders += totalCount;
            maxBuilderCount = Math.max(maxBuilderCount, totalCount);
            maxRankScore = Math.max(maxRankScore, avgScore);

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'country',
              country: stats
            })}\n\n`));
          }
        }

        if (i + batchSize < majorCountries.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const globeData: GlobeData = {
        countries: countryStats.sort((a, b) => {
          if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
          return b.builderCount - a.builderCount;
        }),
        totalBuilders,
        maxBuilderCount: Math.max(1, maxBuilderCount),
        maxRankScore: Math.max(1, maxRankScore)
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'complete',
        data: globeData
      })}\n\n`));

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
