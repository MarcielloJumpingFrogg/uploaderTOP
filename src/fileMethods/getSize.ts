import { round10 } from "../functions/decimalAdjust";
import type { element } from "./fileTypes";

export function getSize(sizeInBit: number) {
  const measureUnit = ["bit", "byte", "Kb", "Mb", "Gb"];
  let currentUnit = 1;
  let currentValue = sizeInBit;
  while (currentValue > 1000) {
    currentUnit++;
    currentValue = currentValue / 1000;
  }

  const rounded = round10(currentValue, -2);
  const finalResult = String(rounded) + measureUnit[currentUnit];
  return finalResult;
}
