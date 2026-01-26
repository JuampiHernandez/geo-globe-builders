import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COUNTRIES, BuilderProfile, TalentAPIResponse } from '@/types';

const TALENT_API_BASE = 'https://api.talentprotocol.com';
const BUILDERS_FOR_RANKING = 100;
const PER_PAGE = 250;

// Use service role key for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const talentApiKey = process.env.TALENT_API_KEY;

// Calculate country score based on top builders' scores
function calculateCountryScore(profiles: BuilderProfile[]): number {
  if (profiles.length === 0) return 0;
  const totalScore = profiles.reduce((sum, p) => sum + (p.builder_score?.points || 0), 0);
  return Math.round(totalScore / profiles.length);
}

// Build the query for country search
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

// Get total count for a country
async function getCountryBuilderCount(countryName: string, apiKey: string, retries: number = 2): Promise<number> {
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
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return 0;
    }
  }
  return 0;
}

// Fetch builders for a country
async function fetchBuildersPage(
  countryName: string,
  apiKey: string,
  page: number = 1,
  perPage: number = PER_PAGE,
  retries: number = 2
): Promise<{ profiles: BuilderProfile[]; total: number }> {
  const query = buildCountryQuery(countryName);
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
async function fetchTopBuilders(countryName: string, apiKey: string, maxBuilders: number = BUILDERS_FOR_RANKING) {
  const { profiles, total } = await fetchBuildersPage(countryName, apiKey, 1, Math.min(maxBuilders, PER_PAGE));
  return { 
    profiles: profiles.slice(0, maxBuilders), 
    total 
  };
}

// POST endpoint to trigger sync
export async function POST(request: Request) {
  // Verify API key or authentication
  const authHeader = request.headers.get('authorization');
  const syncKey = process.env.SYNC_API_KEY;
  
  if (syncKey && authHeader !== `Bearer ${syncKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey || !talentApiKey) {
    return NextResponse.json({ 
      error: 'Missing required environment variables' 
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'start',
        totalCountries: majorCountries.length
      })}\n\n`));

      const batchSize = 5;
      let processedCount = 0;

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
            try {
              const totalCount = await getCountryBuilderCount(country.name, talentApiKey);
              
              if (totalCount === 0) {
                return null;
              }
              
              const { profiles } = await fetchTopBuilders(country.name, talentApiKey, BUILDERS_FOR_RANKING);
              const avgScore = calculateCountryScore(profiles);
              
              return {
                country,
                totalCount,
                profiles,
                avgScore
              };
            } catch (error) {
              console.error(`Error processing ${country.name}:`, error);
              return null;
            }
          })
        );

        // Insert/update data in Supabase
        for (const result of results) {
          if (!result) continue;

          const { country, totalCount, profiles, avgScore } = result;

          try {
            // Upsert country stats
            const { error: statsError } = await supabase
              .from('country_stats')
              .upsert({
                country_code: country.code,
                country: country.name,
                builder_count: totalCount,
                rank_score: avgScore,
                ranked_builders: profiles.length,
                top_builders: profiles.slice(0, 5).map(p => ({
                  name: p.display_name || p.name || 'Anonymous',
                  rank: p.builder_score?.rank_position || null,
                  score: p.builder_score?.points || 0,
                  image_url: p.image_url || ''
                })),
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'country_code'
              });

            if (statsError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                country: country.name,
                error: statsError.message
              })}\n\n`));
              continue;
            }

            // Upsert builder profiles (top 100)
            if (profiles.length > 0) {
              const builderData = profiles.map(p => ({
                id: p.id,
                country_code: country.code,
                name: p.display_name || p.name || 'Anonymous',
                bio: p.bio || '',
                rank: p.builder_score?.rank_position || null,
                score: p.builder_score?.points || 0,
                image_url: p.image_url || '',
                location: p.location || '',
                tags: p.tags || [],
                human_checkmark: p.human_checkmark,
                relative_path: p.relative_path || '',
                last_updated: new Date().toISOString()
              }));

              const { error: buildersError } = await supabase
                .from('builder_profiles')
                .upsert(builderData, {
                  onConflict: 'id'
                });

              if (buildersError) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  country: country.name,
                  error: buildersError.message
                })}\n\n`));
              }
            }

            processedCount++;
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'country_synced',
              country: country.name,
              builderCount: totalCount,
              avgScore: avgScore
            })}\n\n`));
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              country: country.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`));
          }
        }

        if (i + batchSize < majorCountries.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'complete',
        processedCount,
        totalCountries: majorCountries.length
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
