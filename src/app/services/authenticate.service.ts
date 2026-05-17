import { Injectable, signal } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import type { User, AuthResult } from '../models/authenticate.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticateService {
  private readonly EMAIL_REGEX = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
  currentUser = signal<User | null>(null);

  private getUsers(): User[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  private isValidEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  private fail(message: string): AuthResult {
    return {
      success: false,
      message,
    };
  }

  private success(message: string): AuthResult {
    return {
      success: true,
      message,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePassword(password: string): string {
    return password.trim();
  }

  async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPassword = this.normalizePassword(password);

    if (!normalizedEmail || !normalizedPassword) {
      return this.fail('Email and password are required.');
    }

    if (!this.isValidEmail(normalizedEmail)) {
      return this.fail('Please enter a valid email address.');
    }

    if (normalizedPassword.length < 6) {
      return this.fail('Password must be at least 6 characters.');
    }

    const users = this.getUsers();

    const emailExists = users.some((user) => user.email === normalizedEmail);

    if (emailExists) {
      return this.fail('Email already registered.');
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    const newUser: User = {
      email: normalizedEmail,
      passwordHash: passwordHash,
      createdAt: Date.now(),
    };

    users.push(newUser);
    this.saveUsers(users);

    return this.success('Registration successful!');
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPassword = this.normalizePassword(password);

    if (!normalizedEmail || !normalizedPassword) {
      return this.fail('Email and password are required.');
    }

    const users = this.getUsers();

    const user = users.find((user) => user.email === normalizedEmail);

    if (!user) {
      return this.fail('Invalid credentials.');
    }

    const passwordIsValid = await bcrypt.compare(normalizedPassword, user.passwordHash);

    if (!passwordIsValid) {
      return this.fail('Invalid credentials.');
    }

    this.currentUser.set(user);

    return this.success('Login successful!');
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
