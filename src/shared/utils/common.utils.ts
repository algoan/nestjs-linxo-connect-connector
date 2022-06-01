/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { ClassType, transformAndValidateSync } from 'class-transformer-validator';
import { ValidationError } from 'class-validator';

/**
 * Convert null values in the given value to undefined
 */
export function convertNullToUndefined<InputType, ReturnType>(value: InputType): ReturnType {
  const innerConvert = (innerValue: unknown): unknown => {
    // eslint-disable-next-line no-null/no-null
    if (innerValue === null) {
      return undefined;
    }

    if (innerValue instanceof Array) {
      return innerValue.map(convertNullToUndefined);
    }

    if (typeof innerValue === 'object') {
      return Object.keys(innerValue ?? {}).reduce((objU: Record<string, unknown>, key: string): unknown => {
        objU[key] = convertNullToUndefined((innerValue ?? {})[key]);

        return objU;
      }, {});
    }

    return innerValue;
  };

  return innerConvert(value) as ReturnType;
}

/**
 * asserts Type Validation
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function assertsTypeValidation<ValueType extends object>(
  classValidation: ClassType<ValueType>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  value: object,
): asserts value is ValueType {
  try {
    transformAndValidateSync(classValidation, value);
  } catch (e) {
    if (e instanceof Array) {
      const errorMsg: string = e
        .map((error: ValidationError) => Object.values(error.constraints ?? []).join('\n'))
        .join('\n');

      throw new Error(`${classValidation.name} validation: \n ${errorMsg}`);
    }

    throw e;
  }
}

/**
 * Delay function
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve: () => void) => setTimeout(resolve, ms));
}
