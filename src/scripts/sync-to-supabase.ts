/**
 * Script to sync builder data from Talent Protocol API to Supabase
 * Run this script periodically to keep the database updated
 * 
 * Usage: npm run sync
 */

import { createClient } from '@supabase/supabase-js';
import { COUNTRIES, BuilderProfile, TalentAPIResponse, ECOSYSTEMS, DataPoint } from '../types';

interface DataPointsResponse {
  data_points: DataPoint[];
}

const TALENT_API_BASE = 'https://api.talentprotocol.com';
const BUILDERS_FOR_RANKING = 1000;
const PER_PAGE = 250;

// Use service role key for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const talentApiKey = process.env.TALENT_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !talentApiKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- TALENT_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 60000): Promise<Response> {
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
async function getCountryBuilderCount(countryName: string, retries: number = 2): Promise<number> {
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
            'X-API-KEY': talentApiKey,
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
      console.error(`Error getting count for ${countryName} (attempt ${attempt}):`, error);
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
  page: number = 1,
  perPage: number = PER_PAGE,
  retries: number = 3
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
            'X-API-KEY': talentApiKey,
          },
        },
        60000 // Increased timeout for large queries
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
      console.error(`Error fetching builders for ${countryName} page ${page} (attempt ${attempt}):`, error);
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
async function fetchTopBuilders(countryName: string, maxBuilders: number = BUILDERS_FOR_RANKING) {
  const allProfiles: BuilderProfile[] = [];
  let total = 0;
  
  // Calculate how many pages we need (max 250 per page)
  const pagesNeeded = Math.ceil(maxBuilders / PER_PAGE);
  
  for (let page = 1; page <= pagesNeeded; page++) {
    const remainingBuilders = maxBuilders - allProfiles.length;
    if (remainingBuilders <= 0) break;
    
    const perPage = Math.min(remainingBuilders, PER_PAGE);
    const { profiles, total: pageTotal } = await fetchBuildersPage(countryName, page, perPage);
    
    if (page === 1) {
      total = pageTotal;
    }
    
    allProfiles.push(...profiles);
    
    // If we got fewer profiles than requested, we've reached the end
    if (profiles.length < perPage) break;
    
    // Small delay between pages to avoid rate limiting
    if (page < pagesNeeded) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return { 
    profiles: allProfiles.slice(0, maxBuilders), 
    total 
  };
}

// Fetch data points for a builder (Base ecosystem credentials)
async function fetchBuilderDataPoints(builderId: string, retries: number = 2): Promise<Record<string, string>> {
  // Get Base ecosystem credential slugs
  const baseEcosystem = ECOSYSTEMS.find(e => e.slug === 'base');
  if (!baseEcosystem || baseEcosystem.credentialSlugs.length === 0) {
    return {};
  }

  const slugs = baseEcosystem.credentialSlugs.join(',');
  const params = new URLSearchParams();
  params.append('id', builderId);
  params.append('slugs', slugs);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${TALENT_API_BASE}/data_points?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': talentApiKey,
          },
        },
        10000
      );

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempt));
          continue;
        }
        return {};
      }

      const data: DataPointsResponse = await response.json();
      
      // Convert array to object: credential_slug -> readable_value
      const dataPointsMap: Record<string, string> = {};
      for (const dp of data.data_points || []) {
        dataPointsMap[dp.credential_slug] = dp.readable_value;
      }
      
      return dataPointsMap;
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        continue;
      }
      return {};
    }
  }
  
  return {};
}

// Main sync function
async function syncData() {
  console.log('🚀 Starting data sync to Supabase...\n');

  const majorCountries = COUNTRIES.filter(c => 
    ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'JP', 'CN', 'CA', 'AU', 
     'ES', 'IT', 'NL', 'PT', 'PL', 'UA', 'NG', 'KE', 'ZA', 'AR',
     'MX', 'CO', 'CL', 'PE', 'SG', 'KR', 'ID', 'TH', 'VN', 'PH',
     'TR', 'AE', 'IL', 'EG', 'MA', 'SE', 'NO', 'DK', 'FI', 'CH',
     'AT', 'BE', 'IE', 'CZ', 'RO', 'GR', 'HU', 'RU', 'PK', 'BD'].includes(c.code)
  );

  console.log(`📊 Processing ${majorCountries.length} countries...\n`);

  const batchSize = 5;
  let processedCount = 0;

  for (let i = 0; i < majorCountries.length; i += batchSize) {
    const batch = majorCountries.slice(i, i + batchSize);
    
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(majorCountries.length / batchSize)}`);
    console.log(`   Countries: ${batch.map(c => c.name).join(', ')}`);

    const results = await Promise.all(
      batch.map(async (country) => {
        try {
          // Get total count
          const totalCount = await getCountryBuilderCount(country.name);
          
          if (totalCount === 0) {
            console.log(`   ⚠️  ${country.name}: No builders found`);
            return null;
          }
          
          // Fetch top builders
          const { profiles } = await fetchTopBuilders(country.name, BUILDERS_FOR_RANKING);
          const avgScore = calculateCountryScore(profiles);
          
          console.log(`   ✅ ${country.name}: ${totalCount} builders, avg score: ${avgScore}`);
          
          return {
            country,
            totalCount,
            profiles,
            avgScore
          };
        } catch (error) {
          console.error(`   ❌ ${country.name}: Error -`, error);
          return null;
        }
      })
    );

    // Insert/update data in Supabase
    for (const result of results) {
      if (!result) continue;

      const { country, totalCount, profiles, avgScore } = result;

      try {
          // Count builders in global top 100 (rank_position <= 100)
          const top100Count = profiles.filter(p => 
            p.builder_score?.rank_position && p.builder_score.rank_position <= 100
          ).length;
          
          // Upsert country stats
          const { error: statsError } = await supabase
            .from('country_stats')
            .upsert({
              country_code: country.code,
              country: country.name,
              builder_count: totalCount,
              rank_score: avgScore,
              ranked_builders: top100Count,
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
          console.error(`   ❌ Error saving stats for ${country.name}:`, statsError);
          continue;
        }

        // Upsert builder profiles (top 100) with data points
        if (profiles.length > 0) {
          console.log(`   📊 Fetching data points for ${profiles.length} builders...`);
          
          // Fetch data points for each builder (in smaller batches to avoid rate limits)
          const dataPointsBatch = 10;
          const buildersWithDataPoints = [];
          
          for (let j = 0; j < profiles.length; j += dataPointsBatch) {
            const batchProfiles = profiles.slice(j, j + dataPointsBatch);
            const dataPointsResults = await Promise.all(
              batchProfiles.map(p => fetchBuilderDataPoints(p.id))
            );
            
            batchProfiles.forEach((p, idx) => {
              buildersWithDataPoints.push({
                profile: p,
                dataPoints: dataPointsResults[idx]
              });
            });
            
            // Small delay between batches
            if (j + dataPointsBatch < profiles.length) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          const builderData = buildersWithDataPoints.map(({ profile: p, dataPoints }) => ({
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
            data_points: dataPoints,
            last_updated: new Date().toISOString()
          }));

          const { error: buildersError } = await supabase
            .from('builder_profiles')
            .upsert(builderData, {
              onConflict: 'id'
            });

          if (buildersError) {
            console.error(`   ❌ Error saving builders for ${country.name}:`, buildersError);
          } else {
            const withDataPoints = builderData.filter(b => Object.keys(b.data_points).length > 0).length;
            console.log(`   ✅ Saved ${builderData.length} builders (${withDataPoints} with Base data points)`);
          }
        }

        processedCount++;
      } catch (error) {
        console.error(`   ❌ Database error for ${country.name}:`, error);
      }
    }

    // Rate limiting
    if (i + batchSize < majorCountries.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✨ Sync complete! Processed ${processedCount}/${majorCountries.length} countries`);
}

// Run the sync
syncData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
