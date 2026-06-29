/**
 * A simple `string -> T` map type. We compile to `ES5` and thus do not
 * use https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
 */
export type TMap<T> = { [key: string]: T };

/**
 * Returns true if the given object is `null` or `undefined`.
 */
export function isNone<T>(obj?: T | null | undefined): obj is null | undefined {
    return typeof obj === "undefined" || obj === null;
}

export function isNoneOrEmpty<T>(array?: T[] | null | undefined):
    array is null | undefined | [] {
    return isNone(array) || array.length === 0;
}

export function isNotEmpty<T>(array: T[]): boolean {
    return !isNoneOrEmpty(array);
}

/**
 * Returns true if the given object is not `null` or undefined.
 */
export function isNotNone<T>(obj?: T | null | undefined): obj is T {
    return !isNone(obj);
}

/**
 * Returns the given object if it is not `null` or `undefined`. Otherwise it
 * returns the given default value which may also be a function that computes
 * the default value.
 */
export function ifNone<T>(
    obj: T | null | undefined, defaultValue: T | (() => T)): T {
    if (!isNone(obj)) {
        return obj;
    }
    if (typeof defaultValue === "function") {
        const fn = defaultValue as () => T;
        return fn();
    }
    return defaultValue;
}

/**
 * BEA-style detail sector code (last character is digit zero). Used to avoid
 * defaulting to aggregated parents like `11` when picking an initial sector.
 */
export const PREFERRED_OPEN_DETAIL_SECTOR_CODE = "1111A0";

/** Strip `/US` suffix and spaces so `1111A0` matches `1111A0/US`. */
export function normalizeSectorCodeBase(code: string): string {
    return code.replace(/\/US$/i, "").replace(/\s/g, "").trim();
}

/** Prefer `PREFERRED_OPEN_DETAIL_SECTOR_CODE` when present; otherwise the first sector. */
export { filterPickableSectors, isPickableSector, UNPICKABLE_SECTOR_CODES } from "./filterPickableSectors";

export function pickPreferredBootSector<T extends { code: string }>(
    sectors: T[],
): T | undefined {
    if (!sectors.length) {
        return undefined;
    }
    const preferred = sectors.find(
        (s) =>
            normalizeSectorCodeBase(s.code) ===
            PREFERRED_OPEN_DETAIL_SECTOR_CODE,
    );
    return preferred ?? sectors[0];
}

export function ifNan<T>(
    obj: T | null | undefined, defaultValue: T | (() => T)): T {
    if (!isNone(obj)) {
        if (typeof obj === "number") {
            if (!isNaN(obj)) {
                return obj;
            }
        } else {
            return obj;
        }
    }
    if (typeof defaultValue === "function") {
        const fn = defaultValue as () => T;
        return fn();
    }
    return defaultValue;
}

/**
* Increases the number of decimal digits until the number has the right number of digits
*/
export function formatNumber(x: number): string {
    if (!x)
        return "0.000";
    if (x > 1)
        return x.toFixed(3);
    const digits = Math.max(3, Math.ceil(Math.log10(1/x)));
    return x.toFixed(digits);
}


export function formatNumberGraph(value: number): string {
    if (value == 0) {
        return "0"
    } else if (value > 999.9) {
        return value.toFixed(0);
    } else if (value > 9.9) {
        return value.toFixed(1);
    } 
    else if (value < 0.0001) {
        return value.toExponential(4); 
     }
    else if (value < 0.001) {
        return value.toExponential(3); 
    }
    else if (value < 0.01) {
        return value.toExponential(2); 
    }
     else if (value < 0.1) {
        return value.toFixed(3);
    } else {
        return value.toFixed(2); 
    }
};

//Use in the creation of cvs files and graphs
  const customLabels: Record<string, string> = {
    "GWP-AR6-100": "Global Warming Potential (CO2e)",
    // "GWP-AR6-20": "CO2e based on 20yr GWP",
    "Acidification-Potential": "Acidification Potential (SO2 eq)",
    "Eutrophication-Potential": "Eutrophication Potential (N eq)",
    "Freshwater-withdrawals": "Freshwater Withdrawals",
    "Human-Health---Respiratory-Effects":
      "Human Health Respiratory Effects (PM2.5 eq)",
    "Jobs-Supported": "Jobs Supported",
    "Ozone-Depletion": "Ozone Depletion Potential (CFC eq)",
    "Smog-Formation-Potential": "Smog Formation Potential (O3 eq)",
    // "Value-Added": "Value Added ($)"
    "Commercial-RCRA-Hazardous-Waste": "Commercial Hazardous Waste",
    "sector-purchases": "Sector Purchases",
  };

  /** File slug for sector purchases; supply-chain (`direct`) JSON/UI not shipped yet. */
  export const SECTOR_PURCHASES_FILE_SLUG = "sector-purchases";

  export function sectorPurchasesPointOfConsumptionOnly(
    indicatorSlug: string,
  ): boolean {
    return indicatorSlug === SECTOR_PURCHASES_FILE_SLUG;
  }

  export const getLabel = (filename: string): string => {
    if (customLabels[filename]) return customLabels[filename];

    return filename.replace(/-+/g, " ").trim();
  };

  //Use in the creation of cvs files and graphs
  export const fileNames: string[] = [
      "Acidification-Potential",
      "Eutrophication-Potential",
      "Freshwater-withdrawals",
      // "GWP-AR6-20",
      "GWP-AR6-100",
      "Human-Health---Respiratory-Effects",
      "Jobs-Supported",
      "Ozone-Depletion",
      "Smog-Formation-Potential",
      // "Social-Cost-of-Carbon"
      // "Value-Added"
      "Commercial-RCRA-Hazardous-Waste",
      "Criteria-Air-Pollutants",
      "Releases-to-Ground",
      "Carbon-dioxide",
      "Carbon-monoxide",
      "Lead",
      "Methane",
      "Nitrogen-dioxide",
      "Nitrous-oxide",
      "Particulate-matter-2.5",
      "Sulfur-dioxide",
      "sector-purchases",
    ];