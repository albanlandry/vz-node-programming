/**
 * Transformation Service
 * 
 * Handles data transformations for UI form outputs
 * Phase 6: Advanced data transformation
 */

/**
 * Transformation function type
 */
export type TransformationFunction = (value: unknown, options?: TransformationOptions) => unknown;

/**
 * Transformation options
 */
export interface TransformationOptions {
  /**
   * Additional parameters for the transformation
   */
  params?: Record<string, unknown>;
  
  /**
   * Conditional logic (if condition is met, apply transformation)
   */
  condition?: (value: unknown) => boolean;
}

/**
 * Transformation definition
 */
export interface TransformationDefinition {
  /**
   * Transformation ID/name
   */
  id: string;
  
  /**
   * Display name
   */
  name: string;
  
  /**
   * Description
   */
  description: string;
  
  /**
   * Category (string, number, date, custom)
   */
  category: 'string' | 'number' | 'date' | 'custom' | 'conditional';
  
  /**
   * Transformation function
   */
  transform: TransformationFunction;
  
  /**
   * Whether this transformation requires parameters
   */
  requiresParams?: boolean;
  
  /**
   * Parameter definitions (if requiresParams is true)
   */
  params?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    label: string;
    description?: string;
    defaultValue?: unknown;
  }>;
}

/**
 * String Transformations
 */
const stringTransformations: Record<string, TransformationDefinition> = {
  lowercase: {
    id: 'lowercase',
    name: 'Lowercase',
    description: 'Convert string to lowercase',
    category: 'string',
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        return value.toLowerCase();
      }
      return value;
    },
  },
  uppercase: {
    id: 'uppercase',
    name: 'Uppercase',
    description: 'Convert string to uppercase',
    category: 'string',
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        return value.toUpperCase();
      }
      return value;
    },
  },
  trim: {
    id: 'trim',
    name: 'Trim',
    description: 'Remove leading and trailing whitespace',
    category: 'string',
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return value;
    },
  },
  capitalize: {
    id: 'capitalize',
    name: 'Capitalize',
    description: 'Capitalize first letter of string',
    category: 'string',
    transform: (value: unknown) => {
      if (typeof value === 'string' && value.length > 0) {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    },
  },
  replace: {
    id: 'replace',
    name: 'Replace',
    description: 'Replace substring in string',
    category: 'string',
    requiresParams: true,
    params: [
      { name: 'search', type: 'string', label: 'Search String', description: 'String to find' },
      { name: 'replace', type: 'string', label: 'Replace With', description: 'String to replace with' },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      if (typeof value === 'string' && options?.params) {
        const search = String(options.params.search || '');
        const replace = String(options.params.replace || '');
        return value.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
      }
      return value;
    },
  },
  substring: {
    id: 'substring',
    name: 'Substring',
    description: 'Extract substring',
    category: 'string',
    requiresParams: true,
    params: [
      { name: 'start', type: 'number', label: 'Start Index', description: 'Start position (0-based)', defaultValue: 0 },
      { name: 'end', type: 'number', label: 'End Index', description: 'End position (optional)' },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      if (typeof value === 'string' && options?.params) {
        const start = Number(options.params.start) || 0;
        const end = options.params.end !== undefined ? Number(options.params.end) : undefined;
        return value.substring(start, end);
      }
      return value;
    },
  },
};

/**
 * Number Transformations
 */
const numberTransformations: Record<string, TransformationDefinition> = {
  parseInt: {
    id: 'parseInt',
    name: 'Parse Integer',
    description: 'Convert to integer',
    category: 'number',
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        return parseInt(value, 10);
      }
      return Number(value);
    },
  },
  parseFloat: {
    id: 'parseFloat',
    name: 'Parse Float',
    description: 'Convert to floating point number',
    category: 'number',
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        return parseFloat(value);
      }
      return Number(value);
    },
  },
  round: {
    id: 'round',
    name: 'Round',
    description: 'Round to nearest integer',
    category: 'number',
    transform: (value: unknown) => {
      const num = Number(value);
      if (!isNaN(num)) {
        return Math.round(num);
      }
      return value;
    },
  },
  floor: {
    id: 'floor',
    name: 'Floor',
    description: 'Round down to nearest integer',
    category: 'number',
    transform: (value: unknown) => {
      const num = Number(value);
      if (!isNaN(num)) {
        return Math.floor(num);
      }
      return value;
    },
  },
  ceil: {
    id: 'ceil',
    name: 'Ceiling',
    description: 'Round up to nearest integer',
    category: 'number',
    transform: (value: unknown) => {
      const num = Number(value);
      if (!isNaN(num)) {
        return Math.ceil(num);
      }
      return value;
    },
  },
  multiply: {
    id: 'multiply',
    name: 'Multiply',
    description: 'Multiply by a number',
    category: 'number',
    requiresParams: true,
    params: [
      { name: 'factor', type: 'number', label: 'Factor', description: 'Number to multiply by', defaultValue: 1 },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      const num = Number(value);
      if (!isNaN(num) && options?.params) {
        const factor = Number(options.params.factor) || 1;
        return num * factor;
      }
      return value;
    },
  },
  divide: {
    id: 'divide',
    name: 'Divide',
    description: 'Divide by a number',
    category: 'number',
    requiresParams: true,
    params: [
      { name: 'divisor', type: 'number', label: 'Divisor', description: 'Number to divide by', defaultValue: 1 },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      const num = Number(value);
      if (!isNaN(num) && options?.params) {
        const divisor = Number(options.params.divisor) || 1;
        return divisor !== 0 ? num / divisor : value;
      }
      return value;
    },
  },
  toString: {
    id: 'toString',
    name: 'To String',
    description: 'Convert number to string',
    category: 'number',
    transform: (value: unknown) => {
      return String(value);
    },
  },
};

/**
 * Date Transformations
 */
const dateTransformations: Record<string, TransformationDefinition> = {
  parseDate: {
    id: 'parseDate',
    name: 'Parse Date',
    description: 'Parse string to Date object',
    category: 'date',
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date;
      }
      return value;
    },
  },
  formatDate: {
    id: 'formatDate',
    name: 'Format Date',
    description: 'Format date to string',
    category: 'date',
    requiresParams: true,
    params: [
      { name: 'format', type: 'string', label: 'Format', description: 'Date format (e.g., YYYY-MM-DD)', defaultValue: 'YYYY-MM-DD' },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
        const date = value instanceof Date ? value : new Date(value);
        const format = String(options?.params?.format || 'YYYY-MM-DD');
        
        // Simple date formatting
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return format
          .replace('YYYY', String(year))
          .replace('MM', month)
          .replace('DD', day)
          .replace('HH', hours)
          .replace('mm', minutes)
          .replace('ss', seconds);
      }
      return value;
    },
  },
  getTimestamp: {
    id: 'getTimestamp',
    name: 'Get Timestamp',
    description: 'Convert date to Unix timestamp (milliseconds)',
    category: 'date',
    transform: (value: unknown) => {
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.getTime();
      }
      return value;
    },
  },
  addDays: {
    id: 'addDays',
    name: 'Add Days',
    description: 'Add days to date',
    category: 'date',
    requiresParams: true,
    params: [
      { name: 'days', type: 'number', label: 'Days', description: 'Number of days to add', defaultValue: 0 },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        const days = Number(options?.params?.days) || 0;
        date.setDate(date.getDate() + days);
        return date;
      }
      return value;
    },
  },
};

/**
 * Conditional Transformations
 */
const conditionalTransformations: Record<string, TransformationDefinition> = {
  conditional: {
    id: 'conditional',
    name: 'Conditional',
    description: 'Apply transformation based on condition',
    category: 'conditional',
    requiresParams: true,
    params: [
      { name: 'condition', type: 'string', label: 'Condition', description: 'JavaScript condition (e.g., value > 10)' },
      { name: 'trueTransform', type: 'string', label: 'If True', description: 'Transformation ID if condition is true' },
      { name: 'falseTransform', type: 'string', label: 'If False', description: 'Transformation ID if condition is false (optional)' },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      if (!options?.params) return value;
      
      try {
        // Simple condition evaluation (be careful with security)
        const condition = String(options.params.condition || 'true');
        const conditionResult = evaluateCondition(condition, value);
        
        if (conditionResult) {
          const trueTransform = String(options.params.trueTransform || '');
          if (trueTransform) {
            return applyTransformationById(trueTransform, value, {});
          }
        } else {
          const falseTransform = String(options.params.falseTransform || '');
          if (falseTransform) {
            return applyTransformationById(falseTransform, value, {});
          }
        }
      } catch (e) {
        console.warn('Condition evaluation failed:', e);
      }
      
      return value;
    },
  },
  filter: {
    id: 'filter',
    name: 'Filter',
    description: 'Filter value based on condition (returns null if condition fails)',
    category: 'conditional',
    requiresParams: true,
    params: [
      { name: 'condition', type: 'string', label: 'Condition', description: 'JavaScript condition (e.g., value > 10)' },
    ],
    transform: (value: unknown, options?: TransformationOptions) => {
      if (!options?.params) return value;
      
      try {
        const condition = String(options.params.condition || 'true');
        const conditionResult = evaluateCondition(condition, value);
        return conditionResult ? value : null;
      } catch (e) {
        console.warn('Filter condition evaluation failed:', e);
        return value;
      }
    },
  },
};

/**
 * Evaluate a simple condition
 * WARNING: This is a simplified evaluator. For production, consider using a safer expression parser.
 */
function evaluateCondition(condition: string, value: unknown): boolean {
  try {
    // Replace 'value' with actual value in condition
    const safeCondition = condition.replace(/value/g, JSON.stringify(value));
    // Very basic evaluation - in production, use a proper expression parser
    // This is just for demonstration
    return new Function(`return ${safeCondition}`)();
  } catch (e) {
    console.warn('Condition evaluation error:', e);
    return false;
  }
}

/**
 * All transformations registry
 */
const allTransformations: Record<string, TransformationDefinition> = {
  ...stringTransformations,
  ...numberTransformations,
  ...dateTransformations,
  ...conditionalTransformations,
};

/**
 * Get all transformations
 */
export function getAllTransformations(): TransformationDefinition[] {
  return Object.values(allTransformations);
}

/**
 * Get transformations by category
 */
export function getTransformationsByCategory(category: TransformationDefinition['category']): TransformationDefinition[] {
  return Object.values(allTransformations).filter((t) => t.category === category);
}

/**
 * Get transformation by ID
 */
export function getTransformation(id: string): TransformationDefinition | undefined {
  return allTransformations[id];
}

/**
 * Apply transformation by ID
 */
export function applyTransformationById(
  id: string,
  value: unknown,
  options?: TransformationOptions
): unknown {
  const transformation = getTransformation(id);
  if (!transformation) {
    console.warn(`Transformation not found: ${id}`);
    return value;
  }

  try {
    return transformation.transform(value, options);
  } catch (e) {
    console.error(`Transformation error for ${id}:`, e);
    return value;
  }
}

/**
 * Apply multiple transformations in sequence
 */
export function applyTransformations(
  value: unknown,
  transformationIds: string[],
  options?: Record<string, TransformationOptions>
): unknown {
  let result = value;
  for (const id of transformationIds) {
    result = applyTransformationById(id, result, options?.[id]);
  }
  return result;
}

