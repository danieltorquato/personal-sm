import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);

  // Obter o token do localStorage
  const token = localStorage.getItem('auth_token');

  // Adicionar o token ao cabeçalho de autorização, se disponível
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Interceptar erros de resposta
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verificar se é um erro de autenticação (401)
      if (error.status === 401) {
        // Limpar localStorage e redirecionar para a página de login
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expiration');

        router.navigate(['/login']);
      }

      // Verificar se é um erro de acesso não autorizado (403)
      if (error.status === 403) {
        router.navigate(['/acesso-negado']);
      }

      // Repassar o erro
      return throwError(() => error);
    })
  );
}
