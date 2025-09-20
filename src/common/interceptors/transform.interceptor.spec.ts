import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  it('wraps handler response with ok/data envelope', (done) => {
    const interceptor = new TransformInterceptor();
    const context: any = {};
    const handler = { handle: () => of({ foo: 'bar' }) };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ ok: true, data: { foo: 'bar' } });
      done();
    });
  });
});
