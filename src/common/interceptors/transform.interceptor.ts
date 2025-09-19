import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type StandarResponse<T> = {
  ok: true;
  data: T;
};

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandarResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandarResponse<T>> {
    return next.handle().pipe(map((data) => ({ ok: true, data: data })));
  }
}
