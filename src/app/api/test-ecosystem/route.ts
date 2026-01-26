import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch just a few builders
    const { data: builders, error } = await supabase
      .from('builder_profiles')
      .select('id, country_code, data_points, name')
      .eq('name', 'sweetman')
      .single();
    
    const buildersList = builders ? [builders] : [];

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check how many have Base data
    let withBaseData = 0;
    let sampleWithData: any = null;
    let rawDataPoints: any = null;
    
    for (const builder of buildersList) {
      rawDataPoints = builder.data_points;
      const keys = Object.keys(builder.data_points || {});
      const hasBase = keys.some((key: string) => key.startsWith('base_') || key.startsWith('total_base_'));
      if (hasBase) {
        withBaseData++;
        if (!sampleWithData) {
          sampleWithData = {
            name: builder.name,
            country: builder.country_code,
            dataPointsCount: keys.length,
            sampleKeys: keys.slice(0, 3)
          };
        }
      }
    }

    return NextResponse.json({
      totalBuilders: buildersList.length,
      withBaseData,
      sampleBuilder: sampleWithData,
      rawDataPoints: rawDataPoints,
      dataPointsType: typeof rawDataPoints,
      dataPointsKeys: rawDataPoints ? Object.keys(rawDataPoints) : []
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
