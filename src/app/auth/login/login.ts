import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Form } from '../form/form';
import { AuthenticateService } from '../../services/authenticate.service';

type Data = {
  email: string;
  password: string;
};

@Component({
  selector: 'app-login',
  imports: [Form, Form],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthenticateService);
  private router = inject(Router);

  message = signal('');
  messageType = signal<'error' | 'success'>('error');

  async onSubmit(data: Data) {
    this.message.set('');
    const email = data.email;
    const password = data.password;
    const result = await this.authService.login(email, password);

    if (result.success) {
      this.router.navigate(['/scheduler']);
    } else {
      this.messageType.set('error');
      this.message.set(result.message);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
