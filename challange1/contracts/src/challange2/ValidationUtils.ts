import { UInt64, Bool } from "./types";

export class ValidationUtils {
    static equalsZero(value: UInt64): Bool {
      return value.equals(UInt64.zero);
    }
  
    static lessThanOrEqual(value: UInt64, compareTo: UInt64): Bool {
      return value.lessThanOrEqual(compareTo);
    }
  
    static greaterThan(value: UInt64, compareTo: UInt64): Bool {
      return value.greaterThan(compareTo);
    }
  
    static validateRange(value: UInt64, min: number, max: number): Bool {
      return Bool(true)
        .and(value.greaterThanOrEqual(UInt64.from(min)))
        .and(value.lessThanOrEqual(UInt64.from(max)));
    }
  
    static checksumCheck(checksum: UInt64, values: UInt64[]): Bool {
      return checksum.equals(values.reduce((acc, curr) => acc.add(curr), UInt64.zero));
    }
  }