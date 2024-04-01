
export interface WebApiConfig {

    /**
     * This can be a relative path when the API data is hosted as JSON files on
     * the same server, e.g. `./api`.
     */
    endpoint: string;
  
    /**
     * The ID of the input-output model that should be used (an API endpoint
     * can host multiple models which are identified by an unique ID).
     */
    model?: string;
  
    /**
     * Indicates whether the `.json` extension should be added to the request
     * paths. This needs to be set to `true` if the data is hosted as static
     * files on a server (note that in this case calculations are done locally
     * in JavaScript and may require more time and data).
     */
    asJsonFiles?: boolean;
  
  }

  export function modelOfSmartSector(config: WebApiConfig & { model: string }) {
    const api = new WebApiSmartSector(config);
    return new WebModelSmartSector(api, config.model);
  }


export class WebApiSmartSector {
  private readonly _endpoint;

  /**
   * Creates a new instance based on the given configuration.
   */
  constructor(private _config: WebApiConfig) {
    if (!_config || !_config.endpoint) {
      throw new Error('invalid endpoint');
    }
    let endpoint = _config.endpoint;
    if (!endpoint.endsWith("/")) {
      endpoint += "/";
    }
    this._endpoint = endpoint;
  }


/**
   * Returns the full path to a resource target of this API endpoint.
   *
   * @param path the path segments of the resource (e.g. `'modelv2', 'sectors'`)
   * @returns the full path of the resource target (e.g.
   * `http://localhost/api/modelv2/sectors`)
   */
private _target(...path: string[]): string {
  if (!path) {
    return this._endpoint;
  }
  let target = this._endpoint;
  for (const p of path) {
    if (!p) {
      continue;
    }
    if (!target.endsWith("/")) {
      target += "/";
    }
    target += p;
  }
  return target;
}

 /**
   * Performs a `get` request on this API endpoint for the given path and
   * returns the response as JSON.
   *
   * @param path the path segments of the request
   * @returns a promise of the requested resource
   */
  async getJson<T>(...path: string[]): Promise<T> {

    // construct the URL
    let url = this._target(...path);
    if (this._config.asJsonFiles) {
      if (!url.endsWith(".json")) {
        url += ".json";
      }
    }

    // perform the request
    const req = this._request("GET", url);
    return new Promise<T>((resolve, reject) => {
      req.onload = () => {
        if (req.status === 200) {
          try {
            const t: T = JSON.parse(req.responseText);
            resolve(t);
          } catch (err) {
            reject("failed to parse response for: "
              + url + ": " + err);
          }
        } else {
          reject(`request ${url} failed: ${req.statusText}`);
        }
      };
      req.send();
    });
  }

  private _request(method: "GET" | "POST", url: string): XMLHttpRequest {
    const req = new XMLHttpRequest();
    req.open(method, url);
    req.setRequestHeader(
      "Content-Type",
      "application/json;charset=UTF-8");
    return req;
  }

   async api<T>(...path: string[]): Promise<T> {
    // construct the URL
    let url = this._target(...path);
    if (this._config.asJsonFiles) {
      if (!url.endsWith(".json")) {
        url += ".json";
      }
    }
        return fetch(url)
          .then((response) => {
            return response.json().then(data => data as T);
          })
    }  
  

}   

/**
 * A `Model` instance caches the results of API requests
 * SMART SECTOR EEIO model.
 */
export class WebModelSmartSector {

  private _sectoMapping?: SectorMapping[];
  private _sectorOutput?: ImpactOutput[];

  

  constructor(private api: WebApiSmartSector, private readonly modelId: string) {
  }

  id(): string {
    return this.modelId;
  }

   /**
   * Returns the sector_contribution_to_impact_ghg of the smart sector EEIO model.
   */
  async sectorContributionToImpactGhg(fileName:string): Promise<SectorContributionToImpact[]> 
  {
    return await this.api.getJson(this.modelId,  "sector_contribution_to_impact/"+fileName)
  }

   /**
   * Returns the sector_contribution_to_impact_ghg of the smart sector EEIO model.
   */
   async sectorContributionToImpactGhgAPI(fileName:string): Promise<SectorContributionToImpact[]> 
   {
     return await this.api.api(this.modelId,  "sector_contribution_to_impact/"+fileName)
   }
  

  /**
   * Returns the sector_mapping of the smart sector EEIO model.
   */
       async sectorMapping(): Promise<SectorMapping[]> {
        if (!this._sectoMapping) 
        this._sectoMapping = await this.api.getJson(this.modelId,  "sector_mapping");

      
      return this._sectoMapping || [];
    }

    /**
   * Returns the x of the smart sector EEIO model.
   */
     async impactOutPut(): Promise<ImpactOutput[]> {
          if (!this._sectorOutput) 
          this._sectorOutput = await this.api.getJson(this.modelId,  "commodity_output");
    
        
        return this._sectorOutput || [];
      }

    /**
   * Get the output of the specific impactOutput
   */
   findSectorOutput(id: string, impactList:ImpactOutput[]): number {
    const impactoutput:ImpactOutput = impactList.find(d => {
      if (id === d.sector_code) {
        return true;
      }
    });
    return impactoutput ? impactoutput.x : 0;
  }

  
    /**
   * Get the output of the specific impactOutput
   */
    findPurchasedGroup(id: string, SectorMappingList:SectorMapping[]): string {
      const sectorMapping:SectorMapping = SectorMappingList.find(d => {
        if (id === d.id) {
          return true;
        }
      });
      return sectorMapping.group;
    }
  
}



export interface SectorContributionToImpact {

  sector_code?: string;
  emissions_source?: string;
  purchased_commodity_code?: string;
  impact_per_purchase?: number;
  commodity_output?: number;
  total_impact?: number;

}


export interface SectorMapping {

  id: string;
   
  group: string;


}

export interface ImpactOutput {

  sector_code: string;
   
  x: number;

}