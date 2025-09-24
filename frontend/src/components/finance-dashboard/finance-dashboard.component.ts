import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { FinanceSidebarComponent } from "../finance-sidebar/finance-sidebar.component";
import { AuthService } from '../../app/auths/auth.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HrSidebarComponent } from '../hr-sidebar/hr-sidebar.component';
import { ManagerSidebarComponent } from '../manager-sidebar/manager-sidebar.component';
import { EmployeeSidebarComponent } from '../employee-sidebar/employee-sidebar.component';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [NavbarComponent, CommonModule, NgChartsModule, FinanceSidebarComponent, FormsModule, ReactiveFormsModule, ToastModule, SidebarComponent, HrSidebarComponent, ManagerSidebarComponent,EmployeeSidebarComponent],
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.css'],
  providers: [MessageService]
})
export class FinanceDashboardComponent implements OnInit {
  username: string = '';
  empId: number = 0;
  clockedIn: boolean = false;
  userRole = '';

  clockInTime!: Date;
  timerDisplay: string = '00:00:00';
  timerInterval: any;

  today: string = new Date().toISOString().split('T')[0];
  currentMonthMin: string = '';
  currentMonthMax: string = '';
  isDropdownOpen = false;

  clockInForm!: FormGroup;
  clockOutForm!: FormGroup;
  regularizeForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.username) {
      this.username = currentUser.username;
    } else {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.username = JSON.parse(storedUser).username;
      }
    }

    // ✅ Attendance status
    this.authService.getCurrentAttendanceStatus().subscribe({
      next: (res: any) => {
        if (res?.employee) this.empId = res.employee.empId;

        if (res?.clockInTime && !res.clockOutTime) {
          this.clockedIn = true;
          const combinedDateTime = `${res.date}T${res.clockInTime}`;
          this.clockInTime = new Date(combinedDateTime);
          this.startTimer();
        } else {
          this.clockedIn = false;
        }
      },
      error: (err) => console.error("Failed to fetch attendance status", err)
    });

    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);   // Jan 1 of this year
    this.currentMonthMin = firstDayOfYear.toISOString().split('T')[0];
    this.currentMonthMax = this.today;  // today is already defined


    this.clockInForm = this.fb.group({
      workFrom: ['', Validators.required],
      mode: ['', Validators.required],
      location: ['', [Validators.pattern(/^[a-zA-Z]{0,12}$/)]]  // optional manual location
    });

    this.clockOutForm = this.fb.group({});
    this.regularizeForm = this.fb.group({
      date: ['', Validators.required],
      reason: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9,. ]+$/), Validators.maxLength(50) ]],
    });
  }

  toggleDropdown() {
  this.isDropdownOpen = !this.isDropdownOpen;
}

closeDropdown() {
  this.isDropdownOpen = false;
}

  restrictFutureDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (value) {
      const selectedDate = new Date(value);
      const todayDate = new Date(this.today); // today in yyyy-MM-dd format

      if (selectedDate > todayDate) {
        // Reset to today if user types a future date
        input.value = this.today;
        this.regularizeForm.get('date')?.setValue(this.today, { emitEvent: false });
      }
    }
  }

  onLocationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z]/g, '').slice(0, 12);
    this.clockInForm.get('location')?.setValue(input.value, { emitEvent: false });
  }

  // ✅ Prevent invalid chars in Reason field
  onReasonInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z0-9,. ]/g, '').slice(0, 50);
    this.regularizeForm.get('reason')?.setValue(input.value, { emitEvent: false });
  }

  // ✅ Clock In with fallback
  clockIn() {
    if (!this.clockInForm.valid) {
      this.messageService.add({ severity: 'warn', summary: 'Form Invalid', detail: 'Fill all required fields.' });
      return;
    }

    const { workFrom, mode, location } = this.clockInForm.value;

    // Try browser geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const payload = {
            workFrom,
            mode,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          this.sendClockIn(payload);
        },
        (error) => {
          // Fallback: use manual location if available
          if (location && location.trim() !== '') {
            this.http.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
              .subscribe({
                next: (res: any) => {
                  if (res.length > 0) {
                    const payload = {
                      workFrom,
                      mode,
                      latitude: parseFloat(res[0].lat),
                      longitude: parseFloat(res[0].lon)
                    };
                    this.sendClockIn(payload);
                  } else {
                    this.messageService.add({
                      severity: 'warn',
                      summary: 'Not Found',
                      detail: 'Unable to get coordinates for the given location.'
                    });
                  }
                },
                error: () => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'API Error',
                    detail: 'Failed to fetch coordinates from location.'
                  });
                }
              });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Location Error',
              detail: this.getGeolocationErrorMessage(error) + ' (no manual location provided).'
            });
          }
        }
      );
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Geolocation Not Supported',
        detail: 'Your browser does not support geolocation.'
      });
    }
  }

  // ✅ Clock In API call
  private sendClockIn(payload: any) {
    this.authService.clockInAttendance(payload).subscribe({
      next: (res: any) => {
        this.clockedIn = true;
        this.clockInTime = new Date();
        this.startTimer();
        this.messageService.add({
          severity: 'success',
          summary: 'Clock-in Successful',
          detail: `${res || 'Clocked in'} at ${this.clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
      },
      error: (err) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Clock-in failed, You are already login today'
        })
    });
  }

  // ✅ Location error helper
  getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED: return 'Permission denied. Please allow location access or Apply location manually.';
      case error.POSITION_UNAVAILABLE: return 'Location information is unavailable.';
      case error.TIMEOUT: return 'The request to get location timed out.';
      default: return 'An unknown error occurred while fetching location.';
    }
  }

  // ✅ Timer
  startTimer() {
    this.updateTimer();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }
  updateTimer() {
    const diff = new Date().getTime() - this.clockInTime.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.timerDisplay = this.pad(h) + ':' + this.pad(m) + ':' + this.pad(s);
  }
  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  // ✅ Clock Out
  clockOutAttendance() {
    this.authService.clockOutAttendance().subscribe({
      next: (res: any) => {
        this.clockedIn = false;
        clearInterval(this.timerInterval);
        this.timerDisplay = '00:00:00';
        this.messageService.add({
          severity: 'success',
          summary: 'Clock-out Successful',
          detail: `${res || 'You clocked out'} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
      },
      error: (err) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Clock-out failed'
        })
    });
  }

  // ✅ Regularization
  submitRegularization() {
    if (!this.regularizeForm.valid) {
      this.messageService.add({ severity: 'warn', summary: 'Form Invalid', detail: 'Fill all required fields.' });
      return;
    }
    const date = this.regularizeForm.get('date')?.value;
    const reason = this.regularizeForm.get('reason')?.value;

    if (date < this.currentMonthMin || date > this.currentMonthMax) {
      this.messageService.add({ severity: 'error', summary: 'Invalid Date', detail: 'Please select a valid date this month.' });
      return;
    }

    this.authService.requestRegularization(date, reason).subscribe({
  next: (res: any) =>
    this.messageService.add({
      severity: 'success',
      summary: 'Regularization Submitted',
      detail: res.message // plain string now
    }),
  error: (err) => {
  let errorMsg = 'Something went wrong!';
  if (err?.error) {
    if (typeof err.error === 'string') {
      errorMsg = err.error;
    } else if (err.error.customMessage) {
      errorMsg = err.error.customMessage;  // 👈 pick this only
    } else if (err.error.message) {
      errorMsg = err.error.message;
    }
  }
  this.messageService.add({
    severity: 'error',
    summary: 'Request Failed',
    detail: errorMsg
  });
}
    });

  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}


