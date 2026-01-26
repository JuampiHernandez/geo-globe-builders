import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CountryStats, GlobeData } from '@/types';
import {
  calculateNormalizationStats,
  calculateBuilderEcosystemScore,
  hasBaseEcosystemData,
  getCredentialsForNormalization,
  BASE_CREDENTIALS,
  type BuilderWithDataPoints
} from '@/lib/ecosystem-scoring';

// GET endpoint - Fetch ecosystem-filtered data
export async function GET(request: Request) {
  // Check for required environment variables at runtime
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ 
      error: 'Supabase configuration missing. Please set environment variables.' 
    }, { status: 500 });
  }
  
  console.log('🔵 ECOSYSTEM API CALLED');
  const { searchParams } = new URL(request.url);
  const ecosystem = searchParams.get('ecosystem');
  console.log('Ecosystem param:', ecosystem);

  // Only support Base ecosystem for now
  if (!ecosystem || ecosystem !== 'base') {
    return NextResponse.json({ error: 'Invalid ecosystem. Only "base" is supported.' }, { status: 400 });
  }

  try {
    console.log('Fetching builders from Supabase...');
    // Fetch ALL builders with their data points
    // Supabase has a default limit of 1000, so we need to fetch in batches
    let allBuilders: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('builder_profiles')
        .select('id, country_code, data_points, name, image_url, score, rank')
        .range(from, from + batchSize - 1);
      
      if (batchError) {
        console.error('Error fetching batch:', batchError);
        break;
      }
      
      if (batch && batch.length > 0) {
        allBuilders = allBuilders.concat(batch);
        from += batchSize;
        hasMore = batch.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    const builders = allBuilders;
    const error = null;

    console.log('Query result - error:', error, 'builders count:', builders?.length);

    if (error) {
      console.error('Error fetching builders:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!builders || builders.length === 0) {
      console.log('No builders found in database');
      return NextResponse.json({ 
        error: 'No data available' 
      }, { status: 503 });
    }

    // Filter builders who have Base ecosystem data
    console.log(`Total builders in DB: ${builders.length}`);
    console.log(`Sample builder:`, builders[0]?.name, 'data_points keys:', Object.keys(builders[0]?.data_points || {}).length);
    
    const baseBuilders = builders.filter(b => {
      const dataPoints = b.data_points as Record<string, string> || {};
      const keys = Object.keys(dataPoints);
      const hasBase = keys.some(key => key.startsWith('base_') || key.startsWith('total_base_'));
      return hasBase;
    }) as BuilderWithDataPoints[];

    console.log(`Base builders found: ${baseBuilders.length}`);

    if (baseBuilders.length === 0) {
      return NextResponse.json({
        countries: [],
        totalBuilders: 0,
        maxBuilderCount: 1,
        maxRankScore: 1
      });
    }

    // Calculate normalization stats for all credentials that need it
    const credentialsToNormalize = getCredentialsForNormalization();
    
    const normalizationStats: Record<string, { min: number; max: number }> = {};
    for (const credential of credentialsToNormalize) {
      const config = BASE_CREDENTIALS[credential];
      if (config) {
        normalizationStats[credential] = calculateNormalizationStats(baseBuilders, credential, config);
      }
    }

    // Calculate ecosystem points for each builder
    const buildersWithPoints = baseBuilders.map(builder => ({
      ...builder,
      ecosystemPoints: calculateBuilderEcosystemScore(builder, normalizationStats)
    }));

    // Group by country and calculate country stats
    const countryMap = new Map<string, {
      builders: typeof buildersWithPoints;
      totalPoints: number;
    }>();

    for (const builder of buildersWithPoints) {
      const existing = countryMap.get(builder.country_code);
      if (existing) {
        existing.builders.push(builder);
        existing.totalPoints += builder.ecosystemPoints;
      } else {
        countryMap.set(builder.country_code, {
          builders: [builder],
          totalPoints: builder.ecosystemPoints
        });
      }
    }

    // Get country names from country_stats table
    const { data: countryStatsData } = await supabase
      .from('country_stats')
      .select('country, country_code');

    const countryNameMap = new Map<string, string>();
    if (countryStatsData) {
      for (const cs of countryStatsData) {
        countryNameMap.set(cs.country_code, cs.country);
      }
    }

    // Build country stats
    const countries: CountryStats[] = [];
    for (const [countryCode, data] of countryMap.entries()) {
      const countryName = countryNameMap.get(countryCode) || countryCode;
      const builderCount = data.builders.length;
      const avgPoints = Math.round(data.totalPoints / builderCount);
      
      // Calculate logarithmic weighted score
      // This balances quality (avgPoints) with quantity (builderCount)
      // Formula: avgPoints × log10(builderCount + 1) × 10
      const logWeightedScore = Math.round(
        avgPoints * Math.log10(builderCount + 1) * 10
      );
      
      // Sort builders by ecosystem points
      const sortedBuilders = data.builders.sort((a, b) => b.ecosystemPoints - a.ecosystemPoints);
      
      // Count builders with global rank <= 100
      const top100Count = data.builders.filter(b => 
        b.rank && b.rank <= 100
      ).length;
      
      countries.push({
        country: countryName,
        countryCode,
        builderCount,
        rankScore: logWeightedScore,
        rankedBuilders: top100Count,
        topBuilders: sortedBuilders.slice(0, 5).map(b => ({
          name: b.name || 'Anonymous',
          rank: b.rank || null,
          score: b.ecosystemPoints,
          image_url: b.image_url || ''
        }))
      });
    }

    // Sort countries by logarithmic weighted score
    countries.sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      return b.builderCount - a.builderCount;
    });

    const totalBuilders = baseBuilders.length;
    const maxBuilderCount = Math.max(1, ...countries.map(c => c.builderCount));
    const maxRankScore = Math.max(1, ...countries.map(c => c.rankScore));

    const globeData: GlobeData = {
      countries,
      totalBuilders,
      maxBuilderCount,
      maxRankScore
    };

    return NextResponse.json(globeData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
