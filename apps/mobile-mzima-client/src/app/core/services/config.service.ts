import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, lastValueFrom, map, Observable, tap } from 'rxjs';
import { MapConfigInterface } from '../intefaces/session.interface';
import { SessionService } from './session.service';
import { EnvService } from './env.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor(
    protected httpClient: HttpClient,
    private env: EnvService,
    private sessionService: SessionService,
  ) {}

  getApiVersions(): string {
    return this.env.environment.api_v3;
  }

  getResourceUrl(): string {
    return 'config';
  }

  getSite(): Observable<any> {
    return this.httpClient
      .get(
        `${this.env.environment.backend_url + this.getApiVersions() + this.getResourceUrl()}/site`,
      )
      .pipe(
        tap({
          next: (data) => {
            this.sessionService.setConfigurations('site', data);
          },
          error: () => setTimeout(() => this.getSite(), 5000),
        }),
      );
  }

  getFeatures(): Observable<any> {
    return this.httpClient
      .get(
        `${
          this.env.environment.backend_url + this.getApiVersions() + this.getResourceUrl()
        }/features`,
      )
      .pipe(
        tap({
          next: (data) => {
            this.sessionService.setConfigurations('features', data);
          },
          error: () => setTimeout(() => this.getFeatures(), 5000),
        }),
      );
  }

  getMap(): Observable<MapConfigInterface> {
    return this.httpClient
      .get<MapConfigInterface>(
        `${this.env.environment.backend_url + this.getApiVersions() + this.getResourceUrl()}/map`,
      )
      .pipe(
        tap({
          next: (data) => {
            if (data.default_view?.baselayer === 'MapQuest') {
              data.default_view.baselayer = 'streets';
            }
            if (data.default_view?.baselayer === 'MapQuestAerial') {
              data.default_view.baselayer = 'satellite';
            }
            this.sessionService.setConfigurations('map', data);
          },
          error: () => setTimeout(() => this.getMap(), 5000),
        }),
      );
  }

  update(id: string | number, resource: any) {
    return this.httpClient.put(
      `${this.env.environment.backend_url + this.getApiVersions() + this.getResourceUrl()}/${id}`,
      resource,
    );
  }

  initAllConfigurations() {
    return lastValueFrom(forkJoin([this.getSite(), this.getFeatures(), this.getMap()]));
  }

  public getProvidersData(isAllData = false, dataSources?: any): Observable<any> {
    return this.httpClient
      .get<any>(
        `${
          this.env.environment.backend_url + this.getApiVersions() + this.getResourceUrl()
        }/data-provider`,
      )
      .pipe(
        map((data) => {
          let providers: any[] = [];
          for (const dataKey in data.providers) {
            if (dataSources?.length) {
              for (const { id } of dataSources) {
                if (dataKey === id) {
                  providers = [...providers, this.addToProviderSArray(dataKey, data)];
                }
              }
            } else {
              providers = [...providers, this.addToProviderSArray(dataKey, data)];
            }
          }
          return isAllData ? data : providers;
        }),
      );
  }

  public updateProviders(providers: any): Observable<any> {
    return this.httpClient.put(
      `${
        this.env.environment.backend_url + this.getApiVersions() + this.getResourceUrl()
      }/data-provider`,
      providers,
    );
  }

  private addToProviderSArray(dataKey: string, data: any) {
    return {
      label: dataKey.toLowerCase(),
      value: data.providers[dataKey],
    };
  }
}