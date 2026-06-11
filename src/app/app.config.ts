import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient ,withInterceptors} from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Router avec transitions fluides entre les pages
    provideRouter(routes, withViewTransitions()),
    // HttpClient (sera utilisé quand les services API seront branchés)
    provideHttpClient(withInterceptors([ authInterceptor])),
  ]
};