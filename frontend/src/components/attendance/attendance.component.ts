import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../app/auths/auth.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HrSidebarComponent } from '../hr-sidebar/hr-sidebar.component';
import { ManagerSidebarComponent } from '../manager-sidebar/manager-sidebar.component';
import { EmployeeSidebarComponent } from '../employee-sidebar/employee-sidebar.component';
import { FinanceSidebarComponent } from '../finance-sidebar/finance-sidebar.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ToastModule, SidebarComponent, HrSidebarComponent, ManagerSidebarComponent, FinanceSidebarComponent, EmployeeSidebarComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent implements OnInit {
  clockInForm!: FormGroup;
  clockOutForm!: FormGroup;
  regularizeForm!: FormGroup;
  empId: string = '';
  userRole = '';
  clockedIn: boolean = false;  
  attendanceRequests: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.userRole= this.authService.getUserRole();
    this.empId = this.authService.getEmployeeIdFromToken();
     this.loadAllRegularizationRequests();

    this.clockInForm = this.fb.group({
      mode: ['WEB', Validators.required],
      location: ['', Validators.required],
      workFrom: ['', Validators.required],
    });

    this.clockOutForm = this.fb.group({
      employeeId: [this.empId, Validators.required],
    });

    this.regularizeForm = this.fb.group({
      date: ['', Validators.required],
      reason: ['', Validators.required],
    });
  }

loadAllRegularizationRequests(): void {
    this.authService.getAllRegularizationRequests().subscribe({
      next: (data) => {
        console.log('🔍 Loaded Regularizations:', data);
        this.attendanceRequests = data;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load regularization requests' });
      }
  });
}

approveRegularizationRequest(attendanceId: number): void {
  this.authService.approveRegularization(attendanceId).subscribe({
    next: (res: string) => {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Approved', 
        detail: res   // 👈 will show "Regularization approved successfully"
      });
      this.loadAllRegularizationRequests(); // refresh after success
    },
    error: (err) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error || 'Approval failed',
      });
    },
  });
}

rejectRegularization(attendanceId: number) {
  const reason = prompt("Enter rejection reason:");

  if (!reason) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Cancelled',
      detail: 'Rejection reason required'
    });
    return;
  }

  this.authService.rejectRegularizationRequest(attendanceId, reason).subscribe({
    next: (res: string) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Rejected',
        detail: res   // 👈 now shows backend message
      });
      this.loadAllRegularizationRequests(); // refresh list
    },
    error: (err: any) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error || 'Failed to reject request'
      });
    }
  });
}


 goBack(): void {
  window.history.back();
}

}