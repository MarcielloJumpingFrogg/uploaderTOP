import { round10 } from "../functions/decimalAdjust";
import type { element } from "./fileTypes";

export function getSize(element: element) {
  if (element.type !== "folder" && element.sessionId === null) {
    const item = element.item;

    const sizeInBit = item.metadata.size;
    const measureUnit = ["bit", "byte", "Kb", "Mb", "Gb"];
    let currentUnit = 1;
    let currentValue = sizeInBit;
    while (currentValue > 1024) {
      currentUnit++;
      currentValue = currentValue / 1024;
    }

    const rounded = round10(currentValue, -2);
    const finalResult = String(rounded) + measureUnit[currentUnit];
    return finalResult;
  } else {
    return "-";
  }
}
