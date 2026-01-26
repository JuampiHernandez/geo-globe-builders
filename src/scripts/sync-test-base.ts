/**
 * Test script to sync just a few countries with Base ecosystem data
 * Usage: npm run sync:test
 */

import { createClient } from '@supabase/supabase-js';
import { COUNTRIES, BuilderProfile, TalentAPIResponse, ECOSYSTEMS, DataPoint } from '../types';

interface DataPointsResponse {
  data_points: DataPoint[];
}

const TALENT_API_BASE = 'https://api.talentprotocol.com';
const BUILDERS_FOR_RANKING = 20; // Reduced for testing
const PER_PAGE = 250;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const talentApiKey = process.env.TALENT_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !talentApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function calculateCountryScore(profiles: BuilderProfile[]): number {
  if (profiles.length === 0) return 0;
  const totalScore = profiles.reduce((sum, p) => sum + (p.builder_score?.points || 0), 0);
  return Math.round(totalScore / profiles.length);
}

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
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return 0;
    }
  }
  return 0;
}

async function fetchBuildersPage(
  countryName: string,
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
            'X-API-KEY': talentApiKey,
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

async function fetchTopBuilders(countryName: string, maxBuilders: number = BUILDERS_FOR_RANKING) {
  const { profiles, total } = await fetchBuildersPage(countryName, 1, Math.min(maxBuilders, PER_PAGE));
  return { 
    profiles: profiles.slice(0, maxBuilders), 
    total 
  };
}

async function fetchBuilderDataPoints(builderId: string, retries: number = 2): Promise<Record<string, string>> {
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

async function syncTestData() {
  console.log('🧪 Starting TEST sync with Base ecosystem data...\n');

  // Test with just 3 countries
  const testCountries = COUNTRIES.filter(c => ['US', 'GB', 'AR'].includes(c.code));

  console.log(`📊 Testing with ${testCountries.length} countries: ${testCountries.map(c => c.name).join(', ')}\n`);

  for (const country of testCountries) {
    console.log(`\n🔍 Processing ${country.name}...`);
    
    try {
      const totalCount = await getCountryBuilderCount(country.name);
      
      if (totalCount === 0) {
        console.log(`   ⚠️  No builders found`);
        continue;
      }
      
      const { profiles } = await fetchTopBuilders(country.name, BUILDERS_FOR_RANKING);
      const avgScore = calculateCountryScore(profiles);
      
      console.log(`   ✅ Found ${totalCount} builders, fetching top ${profiles.length}`);
      console.log(`   📊 Fetching Base ecosystem data points...`);
      
      // Fetch data points for each builder
      const buildersWithDataPoints = [];
      for (const profile of profiles) {
        const dataPoints = await fetchBuilderDataPoints(profile.id);
        buildersWithDataPoints.push({
          profile,
          dataPoints
        });
        
        // Log if we found Base data
        if (Object.keys(dataPoints).length > 0) {
          console.log(`      🔵 ${profile.display_name || profile.name}: ${Object.keys(dataPoints).length} Base credentials`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Save to Supabase
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
        console.error(`   ❌ Error saving stats:`, statsError);
        continue;
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
        console.error(`   ❌ Error saving builders:`, buildersError);
      } else {
        const withDataPoints = builderData.filter(b => Object.keys(b.data_points).length > 0).length;
        console.log(`   ✅ Saved ${builderData.length} builders (${withDataPoints} with Base data)`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${country.name}:`, error);
    }
  }

  console.log(`\n✨ Test sync complete!`);
  console.log(`\nNow you can:`);
  console.log(`  1. Run: npm run dev`);
  console.log(`  2. Select "Base Ecosystem" from the dropdown`);
  console.log(`  3. See the filtered results!`);
}

syncTestData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
