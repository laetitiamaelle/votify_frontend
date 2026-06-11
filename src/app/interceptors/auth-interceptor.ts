import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  //  utiliser 'access_token' (et pas seulement 'token' ou 'access')
  const token = localStorage.getItem('access_token');

  console.log("L'intercepteur vérifie le token :", token ? "Présent" : "Absent");

  if (token) {
    // On clone la requête et on insère le header Bearer
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};