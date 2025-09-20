import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ContentfulClientOptions {
  spaceId: string;
  accessToken: string;
  environment: string;
  contentType: string;
  base?: string; // default 'https://cdn.contentful.com'
  timeoutMs?: number;
  retries?: number;
}

export class ContentfulClient {
  private readonly http: AxiosInstance;
  private readonly opts: ContentfulClientOptions;

  constructor(opts: ContentfulClientOptions) {
    this.opts = opts;
    this.http = axios.create({
      baseURL: `${opts.base ?? 'https://cdn.contentful.com'}/spaces/${opts.spaceId}/environments/${opts.environment}`,
      timeout: opts.timeoutMs ?? 15000,
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
      },
    });
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retries = this.opts.retries ?? 3,
  ): Promise<T> {
    let attempt = 0;
    let delay = 500;
    for (;;) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const status = err?.response?.status;
        const retriable =
          status === 429 || (status >= 500 && status < 600) || !status;
        if (!retriable || attempt > retries) throw err;
        // Respeta Retry-After si viene
        const ra = Number(err?.response?.headers?.['retry-after']);
        const wait = !isNaN(ra) ? ra * 1000 : delay;
        await new Promise((r) => setTimeout(r, wait));
        delay = Math.min(delay * 2, 8000);
      }
    }
  }

  async listProducts(params: {
    limit: number;
    skip: number;
    updatedAtGte?: string; // ISO
  }) {
    const query: Record<string, any> = {
      content_type: this.opts.contentType,
      limit: params.limit,
      skip: params.skip,
      order: 'sys.updatedAt', // asc para incremental limpio
    };
    if (params.updatedAtGte) {
      // filtro por fecha de actualización >= (Contentful soporta query 'sys.updatedAt[gte]')
      query['sys.updatedAt[gte]'] = params.updatedAtGte;
    }

    return this.withRetry(async () => {
      const res = await this.http.get('/entries', {
        params: query,
      } as AxiosRequestConfig);
      return res.data as import('./types/contentful').CtfListResponse<
        import('./types/contentful').CtfProductFields
      >;
    });
  }
}
