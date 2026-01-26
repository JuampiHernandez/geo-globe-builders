/**
 * Ecosystem scoring utilities
 * Calculates scores for builders based on their data points
 * Automatically detects data types and applies appropriate scoring logic
 */

export interface BuilderWithDataPoints {
  id: string;
  country_code: string;
  data_points: Record<string, any>;
}

export interface NormalizationStats {
  min: number;
  max: number;
}

/**
 * Data point type detection and value extraction
 */
export enum DataPointType {
  BOOLEAN = 'boolean',
  STRING_PRESENCE = 'string_presence', // Just having the value gives points (e.g., basename)
  NUMERIC = 'numeric',
  COMMA_LIST = 'comma_list',
  DATE = 'date',
}

interface DataPointConfig {
  type: DataPointType;
  weight: number;
  description: string;
}

/**
 * Comprehensive Base ecosystem credential configuration
 * Automatically handles all data types based on analysis
 */
export const BASE_CREDENTIALS: Record<string, DataPointConfig> = {
  // String presence - having the value gives fixed points
  'base_basename': {
    type: DataPointType.STRING_PRESENCE,
    weight: 10,
    description: 'Has a Base name'
  },
  
  // Comma-separated lists - count items and normalize
  'base_basecamp': {
    type: DataPointType.COMMA_LIST,
    weight: 100, // High weight for attending Basecamp
    description: 'Basecamp attendance'
  },
  'base_devfolio_hackathons_participation': {
    type: DataPointType.COMMA_LIST,
    weight: 75,
    description: 'Hackathon participation'
  },
  'base_devfolio_hackathons_won': {
    type: DataPointType.COMMA_LIST,
    weight: 250, // Very high weight for winning
    description: 'Hackathons won'
  },
  'base_mainnet_contracts_deployed': {
    type: DataPointType.COMMA_LIST,
    weight: 120,
    description: 'Mainnet contracts deployed'
  },
  'base_testnet_contracts_deployed': {
    type: DataPointType.COMMA_LIST,
    weight: 50,
    description: 'Testnet contracts deployed'
  },
  'base_mainnet_contracts_verified': {
    type: DataPointType.COMMA_LIST,
    weight: 60,
    description: 'Verified contracts'
  },
  'base_mainnet_active_contracts': {
    type: DataPointType.COMMA_LIST,
    weight: 180,
    description: 'Active contracts with 10+ users'
  },
  
  // Numeric values - normalize and weight
  'base_out_transactions': {
    type: DataPointType.NUMERIC,
    weight: 60,
    description: 'Total outgoing transactions'
  },
  'base_learn': {
    type: DataPointType.NUMERIC,
    weight: 80,
    description: 'Base Learn completions'
  },
  'base_total_contract_fees': {
    type: DataPointType.NUMERIC,
    weight: 250, // Very high weight for generating fees
    description: 'Total contract fees generated'
  },
  'base_weekly_contract_fees': {
    type: DataPointType.NUMERIC,
    weight: 100,
    description: 'Weekly contract fees'
  },
  'base_total_contract_transactions': {
    type: DataPointType.NUMERIC,
    weight: 140,
    description: 'Total contract transactions'
  },
  'base_monthly_contract_transactions': {
    type: DataPointType.NUMERIC,
    weight: 90,
    description: 'Monthly contract transactions'
  },
  'base_weekly_contract_transactions': {
    type: DataPointType.NUMERIC,
    weight: 70,
    description: 'Weekly contract transactions'
  },
  'total_base_builder_earnings': {
    type: DataPointType.NUMERIC,
    weight: 200, // High weight for earnings
    description: 'Total builder earnings'
  },
  'base_app_creator_rewards': {
    type: DataPointType.NUMERIC,
    weight: 20,
    description: 'App creator rewards'
  },
  
};

/**
 * Extract numeric value from a data point based on its type
 */
function extractNumericValue(value: any, type: DataPointType): number | null {
  if (!value) return null;
  
  switch (type) {
    case DataPointType.STRING_PRESENCE:
      // Just having the value gives 1 point (will be multiplied by weight)
      return 1;
      
    case DataPointType.COMMA_LIST:
      // Count items in comma-separated list
      if (typeof value === 'string') {
        return value.split(',').filter(s => s.trim() !== '').length;
      }
      return null;
      
    case DataPointType.NUMERIC:
      // Parse as number
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      }
      return null;
      
    case DataPointType.DATE:
      // Calculate days since account creation (older = higher value)
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          const now = new Date();
          const daysSinceCreation = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          return Math.max(0, daysSinceCreation);
        } catch {
          return null;
        }
      }
      return null;
      
    case DataPointType.BOOLEAN:
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' ? 1 : 0;
      }
      return null;
      
    default:
      return null;
  }
}

/**
 * Calculate normalization stats for a credential across all builders
 */
export function calculateNormalizationStats(
  builders: BuilderWithDataPoints[],
  credentialSlug: string,
  config: DataPointConfig
): NormalizationStats {
  const values: number[] = [];
  
  for (const builder of builders) {
    const value = builder.data_points[credentialSlug];
    const numValue = extractNumericValue(value, config.type);
    
    if (numValue !== null && numValue > 0) {
      values.push(numValue);
    }
  }
  
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Normalize a value to 0-1 range based on min/max
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return value > 0 ? 1 : 0;
  return (value - min) / (max - min);
}

/**
 * Calculate ecosystem points for a single builder
 */
export function calculateBuilderEcosystemScore(
  builder: BuilderWithDataPoints,
  normalizationStats: Record<string, NormalizationStats>
): number {
  let points = 0;
  const dataPoints = builder.data_points;
  
  // Process all configured credentials
  for (const [slug, config] of Object.entries(BASE_CREDENTIALS)) {
    const value = dataPoints[slug];
    if (!value) continue;
    
    const numValue = extractNumericValue(value, config.type);
    if (numValue === null || numValue <= 0) continue;
    
    // For STRING_PRESENCE type, just add the weight
    if (config.type === DataPointType.STRING_PRESENCE) {
      points += config.weight;
      continue;
    }
    
    // For other types, normalize and apply weight
    const stats = normalizationStats[slug];
    if (!stats || stats.max === 0) continue;
    
    const normalizedValue = normalize(numValue, stats.min, stats.max);
    points += normalizedValue * config.weight;
  }
  
  return Math.round(points);
}

/**
 * Check if a builder has any Base ecosystem data points
 */
export function hasBaseEcosystemData(dataPoints: Record<string, any>): boolean {
  const keys = Object.keys(dataPoints || {});
  return keys.some(key => key.startsWith('base_') || key.startsWith('total_base_'));
}

/**
 * Get all credential slugs that need normalization
 */
export function getCredentialsForNormalization(): string[] {
  return Object.entries(BASE_CREDENTIALS)
    .filter(([_, config]) => config.type !== DataPointType.STRING_PRESENCE)
    .map(([slug, _]) => slug);
}
