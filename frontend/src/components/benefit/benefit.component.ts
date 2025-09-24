import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService, Benefit } from '../../app/auths/auth.service';

import { CommonModule } from '@angular/common';

import { ConfirmationService, MessageService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { SidebarComponent } from '../sidebar/sidebar.component';

import { HrSidebarComponent } from '../hr-sidebar/hr-sidebar.component';

import { ManagerSidebarComponent } from '../manager-sidebar/manager-sidebar.component';

import { FinanceSidebarComponent } from '../finance-sidebar/finance-sidebar.component';

import { EmployeeSidebarComponent } from '../employee-sidebar/employee-sidebar.component';

import { ButtonModule } from 'primeng/button';
 
@Component({

  selector: 'app-benefit',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    ToastModule,

    ConfirmDialogModule,

    ButtonModule,

    SidebarComponent,

    HrSidebarComponent,

    ManagerSidebarComponent,

    FinanceSidebarComponent,

    EmployeeSidebarComponent

  ],

  templateUrl: './benefit.component.html',

  styleUrls: ['./benefit.component.css'],

  providers: [MessageService, ConfirmationService]

})

export class BenefitComponent implements OnInit {

  benefitForm!: FormGroup;

  benefits: any[] = [];

  isEdit: boolean = false;

  editingId: string | null = null;

  userRole = '';

  benefitToDeleteId: string | null = null;
 
  benefitTypes = ['REIMBURSEMENT', 'MONETARY', 'NON_MONETARY'];
 
  constructor(

    private fb: FormBuilder,

    private authService: AuthService,

    private messageService: MessageService,

    private confirmationService: ConfirmationService

  ) {}
 
  ngOnInit(): void {

    this.userRole = this.authService.getUserRole(); // Get user role

    this.initForm();

    this.loadAllBenefits();

  }
 
  initForm(): void {

    this.benefitForm = this.fb.group({

      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/), Validators.maxLength(20)]],

      description: ['', [Validators.required, Validators.maxLength(100)]],

      type: ['', Validators.required],

      isTaxable: [false]

    });

  }
 
  isHrOrAdmin(): boolean {

    return this.userRole === 'ADMIN' || this.userRole === 'HR';

  }
 
  loadAllBenefits(): void {

    this.authService.getAllBenefits().subscribe({

      next: (res) => (this.benefits = res),

      error: () => this.showMessage('error', 'Error', 'Failed to load benefits')

    });

  }
 
  onSubmit(): void {

    if (this.benefitForm.invalid) {

      this.benefitForm.markAllAsTouched();

      return;

    }
 
    const benefit: Benefit = this.benefitForm.value;
 
    if (this.isEdit && this.editingId) {

      this.authService.updateBenefit(this.editingId, benefit).subscribe({

        next: () => {

          this.showMessage('success', 'Updated', 'Benefit updated successfully');

          this.resetForm();

          this.loadAllBenefits();

        },

        error: () => this.showMessage('error', 'Error', 'Failed to update benefit')

      });

    } else {

      this.authService.addBenefit(benefit).subscribe({

        next: () => {

          this.showMessage('success', 'Created', 'Benefit created successfully');

          this.resetForm();

          this.loadAllBenefits();

        },

        error: () => this.showMessage('error', 'Error', 'Failed to create benefit')

      });

    }

  }
 
  editBenefit(b: any): void {

    this.benefitForm.patchValue(b);

    this.isEdit = true;

    this.editingId = b.benefitId;

  }
 
  confirmDelete(b: any) {

    this.benefitToDeleteId = b.benefitId;

    this.confirmationService.confirm({

      message: `Are you sure you want to delete "${b.name}"?`,

      header: 'Confirm Delete',

      icon: 'pi pi-exclamation-triangle',

      accept: () => {

        this.deleteBenefit(this.benefitToDeleteId!);

      }

    });

  }
 
  deleteBenefit(id: string): void {

    this.authService.deleteBenefits(id).subscribe({

      next: () => {

        this.showMessage('success', 'Deleted', 'Benefit deleted');

        this.loadAllBenefits();

      },

      error: () => {

        this.showMessage('error', 'Error', 'Failed to delete benefit');

      }

    });

  }
 
  resetForm(): void {

    this.benefitForm.reset({ isTaxable: false });

    this.isEdit = false;

    this.editingId = null;

  }
 
  showMessage(severity: string, summary: string, detail: string) {

    this.messageService.add({ severity, summary, detail });

  }
 
  goBack(): void {

    window.history.back();

  }

}

 