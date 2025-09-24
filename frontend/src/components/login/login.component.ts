import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../app/auths/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent {
  username = '';
  password = '';
  email = '';
  otp = '';
  newPassword = '';
  isAdmin = true;
  showForgot = false;
  showReset = false;
  passwordVisible = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) { }

  login(): void {
    if (!this.username || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Username and Password is required'
      });
      return;
    }

    if (!this.username) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Username field cannot be empty'
      });
      return;
    }

    if (!this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Password field cannot be empty'
      });
      return;
    }

    if (!this.validatePassword(this.password)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail:
          'Password must be 8-16 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character.'
      });
      return;
    }

    const loginMethod = this.isAdmin
      ? this.authService.adminLogin
      : this.authService.userLogin;

    loginMethod.call(this.authService, this.username, this.password).subscribe({
      next: (res) => {
        const role = res.role || this.authService.getUserRole();
        let route = '';

        if (role === 'ADMIN') {
          route = '/dashboard';
        } else if (role === 'HR') {
          route = '/hr-dashboard';
        } else if (role === 'EMPLOYEE') {
          route = '/employees-dashboard';
        } else if (role === 'MANAGER') {
          route = '/manager-dashboard';
        } else if (role === 'FINANCE') {
          route = '/finance-dashboard';
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Login',
            detail: 'Unknown user role, cannot navigate to dashboard.'
          });
          return;
        }

        this.router.navigate([route]);
      },
      error: (err) => {
        const errorMsg = err?.error?.error || err?.error || '';

        if (errorMsg.toLowerCase().includes('username and password are incorrect')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Username and password are incorrect'
          });
        } else if (errorMsg.toLowerCase().includes('username is incorrect')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Username is incorrect'
          });
        } else if (errorMsg.toLowerCase().includes('password is incorrect')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Password is incorrect'
          });
        }

      }

    });
  }

  toggleUserType(): void {
    this.isAdmin = !this.isAdmin;
  }

  sendOtp(): void {
    if (!this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Email is required'
      });
      return;
    }

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'OTP Sent',
          detail: 'OTP sent to your email'
        });
        this.showForgot = false;
        this.showReset = true;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send OTP'
        });
      }
    });
  }

  resetPassword(): void {
    if (!this.email || !this.otp || !this.newPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'All fields are required'
      });
      return;
    }

    if (!this.validatePassword(this.newPassword)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail:
          'Password must be 8–16 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character.'
      });
      return;
    }

    this.authService.resetPassword(this.email, this.otp, this.newPassword).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password reset successful'
        });
        this.showReset = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to reset password'
        });
      }
    });
  }

  allowAlphanumeric(event: KeyboardEvent) {
    const pattern = /[a-z0-9]/;
    const inputChar = String.fromCharCode(event.keyCode || event.which);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }

    if (this.username.length >= 25) {
      event.preventDefault();
    }
  }

  validatePassword(password: string): boolean {
    const passwordPattern =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,16}$/;
    return passwordPattern.test(password);
  }
}
