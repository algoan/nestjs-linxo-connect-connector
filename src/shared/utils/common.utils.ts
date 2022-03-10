/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { ClassType, transformAndValidateSync } from 'class-transformer-validator';

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
  transformAndValidateSync(classValidation, value);
}

/**
 * Assert a value is defined
 */
export function assertsIsDefined<T>(value: T | undefined, error?: string | Error): asserts value is T {
  if (value === undefined) {
    if (typeof error === 'string') {
      throw new Error(error);
    }

    throw error;
  }
}
