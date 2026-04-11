import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const debugApiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`[DEBUG API] Request: ${req.method} ${req.url}`, req.params.toString());
  
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(`[DEBUG API] Response from ${req.url}:`, event.body);
        }
      },
      error: (err) => {
        console.error(`[DEBUG API] Error from ${req.url}:`, err);
      }
    })
  );
};
