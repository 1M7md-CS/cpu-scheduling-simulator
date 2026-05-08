import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Form } from '../form/form';
import { AuthService } from '../../services/authenticate.service';

type Data = {
  email: string;
  password: string;
};

@Component({
  selector: 'app-register',
  imports: [Form, Form],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  message = signal<string>('');
  messageType = signal<'error' | 'success'>('error');

  async onSubmit(data: Data) {
    this.message.set('');
    const result = await this.authService.register(data.email, data.password);

    if (result.success) {
      this.messageType.set('success');
      this.message.set(result.message);
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
    } else {
      this.messageType.set('error');
      this.message.set(result.message);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
