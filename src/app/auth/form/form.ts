import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  imports: [FormsModule],
  templateUrl: 'form.html',
  styleUrl: './form.css',
})
export class Form {
  logoText = input<string>('');
  title = input<string>('');
  subtitle = input<string>('');
  passwordPlaceholder = input<string>('');
  buttonText = input<string>('');
  toggleText = input<string>('');
  toggleLinkText = input<string>('');

  message = input<string>('');
  messageType = input<'error' | 'success'>('error');

  submitted = output<{ email: string; password: string }>();
  toggleClicked = output<void>();

  email = signal('');
  password = signal('');

  onSubmit() {
    this.submitted.emit({
      email: this.email(),
      password: this.password(),
    });
  }
}
