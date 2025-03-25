import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Verificar se o usuário está logado
    if (this.authService.isLoggedIn()) {

      // Verificar tipo de usuário, se a rota tiver especificado restrições
      const requiredUserType = route.data['userType'] as 'aluno' | 'personal' | 'admin' | undefined;

      if (requiredUserType) {
        // Se o tipo de usuário não for o necessário, redirecionar para a página apropriada
        if (!this.authService.isUserType(requiredUserType)) {
          this.authService.redirectBasedOnUserType();
          return false;
        }
      }

      // Usuário está logado e tem permissão
      return true;
    }

    // Usuário não está logado, redirecionar para o login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
