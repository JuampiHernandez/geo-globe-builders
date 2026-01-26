import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CountryStats, GlobeData, BuilderDetail } from '@/types';

// GET endpoint - Fetch all country stats or specific country builders
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const ecosystem = searchParams.get('ecosystem'); // New parameter

  // Fetch detailed builders for modal (top 100)
  if (countryCode) {
    try {
      // Get country stats
      const { data: countryStats, error: statsError } = await supabase
        .from('country_stats')
        .select('*')
        .eq('country_code', countryCode)
        .single();

      if (statsError || !countryStats) {
        return NextResponse.json({ error: 'Country not found' }, { status: 404 });
      }

      // Get builders for this country
      const { data: builders, error: buildersError } = await supabase
        .from('builder_profiles')
        .select('*')
        .eq('country_code', countryCode)
        .order('score', { ascending: false })
        .limit(1000);

      if (buildersError) {
        console.error('Error fetching builders:', buildersError);
        return NextResponse.json({ error: 'Failed to fetch builders' }, { status: 500 });
      }

      // Filter by ecosystem if specified
      let filteredBuilders = builders || [];
      if (ecosystem === 'base') {
        filteredBuilders = filteredBuilders.filter(b => {
          const dataPoints = b.data_points || {};
          const keys = Object.keys(dataPoints);
          return keys.some(key => key.startsWith('base_') || key.startsWith('total_base_'));
        });
      }

      return NextResponse.json({
        country: countryStats.country,
        countryCode: countryStats.country_code,
        total: ecosystem === 'base' ? filteredBuilders.length : countryStats.builder_count,
        builders: filteredBuilders.map(b => ({
          id: b.id,
          name: b.name,
          bio: b.bio || '',
          rank: b.rank,
          score: b.score,
          image_url: b.image_url || '',
          location: b.location || '',
          tags: b.tags || [],
          human_checkmark: b.human_checkmark,
          relative_path: b.relative_path || ''
        }))
      });
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Fetch aggregate data for all countries (from Supabase)
  try {
    const { data: countryStats, error } = await supabase
      .from('country_stats')
      .select('*')
      .order('rank_score', { ascending: false });

    if (error) {
      console.error('Error fetching country stats:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!countryStats || countryStats.length === 0) {
      return NextResponse.json({ 
        error: 'No data available. Please run the sync script first.' 
      }, { status: 503 });
    }

    // Transform database format to API format
    const countries: CountryStats[] = countryStats.map(stat => ({
      country: stat.country,
      countryCode: stat.country_code,
      builderCount: stat.builder_count,
      rankScore: stat.rank_score,
      rankedBuilders: stat.ranked_builders,
      topBuilders: stat.top_builders || []
    }));

    const totalBuilders = countries.reduce((sum, c) => sum + c.builderCount, 0);
    const maxBuilderCount = Math.max(1, ...countries.map(c => c.builderCount));
    const maxRankScore = Math.max(1, ...countries.map(c => c.rankScore));

    const globeData: GlobeData = {
      countries: countries.sort((a, b) => {
        if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
        return b.builderCount - a.builderCount;
      }),
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

// POST endpoint - Streaming endpoint for progress updates (kept for compatibility)
// This now just returns data from Supabase instantly
export async function POST() {
  try {
    const { data: countryStats, error } = await supabase
      .from('country_stats')
      .select('*')
      .order('rank_score', { ascending: false });

    if (error) {
      console.error('Error fetching country stats:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!countryStats || countryStats.length === 0) {
      return NextResponse.json({ 
        error: 'No data available. Please run the sync script first.' 
      }, { status: 503 });
    }

    // Transform database format to API format
    const countries: CountryStats[] = countryStats.map(stat => ({
      country: stat.country,
      countryCode: stat.country_code,
      builderCount: stat.builder_count,
      rankScore: stat.rank_score,
      rankedBuilders: stat.ranked_builders,
      topBuilders: stat.top_builders || []
    }));

    const totalBuilders = countries.reduce((sum, c) => sum + c.builderCount, 0);
    const maxBuilderCount = Math.max(1, ...countries.map(c => c.builderCount));
    const maxRankScore = Math.max(1, ...countries.map(c => c.rankScore));

    const globeData: GlobeData = {
      countries: countries.sort((a, b) => {
        if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
        return b.builderCount - a.builderCount;
      }),
      totalBuilders,
      maxBuilderCount,
      maxRankScore
    };

    // Create a streaming response for compatibility with existing frontend
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send start event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'start',
          totalCountries: countries.length
        })}\n\n`));

        // Send all countries as loaded
        countries.forEach((country, index) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'country',
            country: country
          })}\n\n`));

          // Send progress updates
          if (index % 5 === 0 || index === countries.length - 1) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              current: index + 1,
              total: countries.length,
              countries: [country.country],
              percentage: Math.round(((index + 1) / countries.length) * 100)
            })}\n\n`));
          }
        });

        // Send complete event
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
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
