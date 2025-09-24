import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../app/auths/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HrSidebarComponent } from '../hr-sidebar/hr-sidebar.component';
import { ManagerSidebarComponent } from '../manager-sidebar/manager-sidebar.component';
import { FinanceSidebarComponent } from '../finance-sidebar/finance-sidebar.component';
import { EmployeeSidebarComponent } from '../employee-sidebar/employee-sidebar.component';

@Component({
  selector: 'app-attendancelist',
  standalone: true,
  imports: [CommonModule, FormsModule,SidebarComponent, HrSidebarComponent, ManagerSidebarComponent, FinanceSidebarComponent, EmployeeSidebarComponent],
  templateUrl: './attendancelist.component.html',
  styleUrls: ['./attendancelist.component.css']
})
export class AttendancelistComponent implements OnInit {
  attendanceList: any[] = [];
  loading = false;
  errorMessage = '';

  empId: string = '';
  fromDate: string = '';
  toDate: string = '';
  userRole='';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole=this.authService.getUserRole();
    // Auto-set empId from token if available
    this.empId = this.authService.getEmployeeIdFromToken();
  }

  // ✅ Prevent negative numbers in Employee ID
  validateEmpId(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (parseInt(input.value, 10) < 1) {
      input.value = ''; // clear invalid
      this.empId = '';
    }
  }

  // ✅ Fetch attendance with validation
  fetchAttendance(): void {
    if (!this.empId || parseInt(this.empId, 10) < 1) {
      this.errorMessage = 'Please enter a valid Employee ID';
      return;
    }
    if (!this.fromDate || !this.toDate) {
      this.errorMessage = 'Please provide From Date and To Date';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.downloadAttendanceCsvReport(this.empId, this.fromDate, this.toDate)
      .subscribe({
        next: (blob) => {
          if (!blob || blob.size === 0) {
            this.errorMessage = 'No attendance data found for given Employee ID and date range';
            this.loading = false;
            return;
          }

          // Trigger CSV download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_${this.empId}_${this.fromDate}_to_${this.toDate}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to fetch attendance';
          console.error(err);
          this.loading = false;
        }
      });
  }

  // ✅ Separate download button
 downloadCSV(): void {
  if (!this.empId || Number(this.empId) <= 0 || !this.fromDate || !this.toDate) {
    alert('Please provide a valid Employee ID, From Date, and To Date');
    return;
  }this.authService.downloadAttendanceCsvReport(this.empId, this.fromDate, this.toDate)
  .subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${this.empId}_${this.fromDate}_to_${this.toDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
  this.errorMessage = `Failed to fetch attendance report: ${err}`;
  this.loading = false;
}
  });

}

  goBack(): void {
    window.history.back();
  }
}
