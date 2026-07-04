import Ajv, { type ErrorObject, type Schema } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) return [];
  return errors.map((err) => {
    const path = err.instancePath || 'request';
    const msg = err.message ?? 'invalid value';
    if (err.params?.allowedValues) {
      return `${path}: ${msg} (allowed: ${err.params.allowedValues.join(', ')})`;
    }
    return `${path.replace(/^\//, '').replace(/\//g, '.') || 'root'}: ${msg}`;
  });
}

export function validateAgainstSchema(schema: Schema, data: unknown): string[] {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (valid) return [];
  return formatErrors(validate.errors);
}

export function assertValidSchema(schema: Schema, data: unknown, label: string): void {
  const errors = validateAgainstSchema(schema, data);
  if (errors.length > 0) {
    throw new Error(`${label} schema validation failed: ${errors.join('; ')}`);
  }
}