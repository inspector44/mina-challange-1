import { UInt64, Bool } from "./types";
import { ValidationUtils } from "./ValidationUtils";

export function checkIfValid(
    agentId: UInt64,
    messageNo: UInt64,
    xLocation: UInt64,
    yLocation: UInt64,
    checksum: UInt64,
    highestMessageNo: UInt64,
  ): Bool {
    const isAgentIdZero = ValidationUtils.equalsZero(agentId);
    const isMessageDuplicate = ValidationUtils.lessThanOrEqual(messageNo, highestMessageNo);
    const isChecksumValid = ValidationUtils.checksumCheck(checksum, [agentId, xLocation, yLocation]);
    const isAgentIdValid = ValidationUtils.lessThanOrEqual(agentId, UInt64.from(3000));
    const isXLocationValid = ValidationUtils.lessThanOrEqual(xLocation, UInt64.from(15000));
    const isYLocationValid = ValidationUtils.validateRange(yLocation, 5000, 20000);
    const isYLocationGreaterThanXLocation = ValidationUtils.greaterThan(yLocation, xLocation);
  
    return isAgentIdZero
      .or(isMessageDuplicate)
      .or(
        isChecksumValid
          .and(isAgentIdValid)
          .and(isXLocationValid)
          .and(isYLocationValid)
          .and(isYLocationGreaterThanXLocation),
      );
  }