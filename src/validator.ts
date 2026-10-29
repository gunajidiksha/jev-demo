/**
 * Schema Validator - Ensures output matches required schema.json format
 */

import Ajv from 'ajv';
import { DecisionPlan } from './types.js';

export class Validator {
  private ajv: Ajv;
  private schema: object;

  constructor(schema: object) {
    this.ajv = new Ajv();
    this.schema = schema;
  }

  /**
   * Validate decision plan against schema
   */
  validate(decisionPlan: DecisionPlan): { valid: boolean; errors: string[] } {
    const validate = this.ajv.compile(this.schema);
    const valid = validate(decisionPlan);

    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map(e => `${e.instancePath} ${e.message}`)
      };
    }

    return { valid: true, errors: [] };
  }
}
