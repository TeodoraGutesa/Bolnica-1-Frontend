import {Component, OnInit} from '@angular/core';
import {PatientService} from "../../../services/patient-service/patient.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {UserService} from "../../../services/user-service/user.service";
import {AdminPromeniZaposlenog, DeparmentShort, HospitalShort, Page} from "../../../models/models";
import {AuthService} from "../../../services/auth.service";
import {LaboratoryService} from "../../../services/laboratory-service/laboratory.service";
import {LabAnalysisDto} from "../../../models/laboratory/LabAnalysisDto";
import {ParameterDto} from "../../../models/laboratory/ParameterDto";
import {PrescriptionAnalysis} from "../../../models/laboratory/PrescriptionAnalysis";
import {PrescriptionType} from "../../../models/laboratory-enums/PrescriptionType";
import {PrescriptionServiceService} from "../../../services/prescription-service/prescription-service.service";
import {Patient} from "../../../models/patient/Patient";


@Component({
  selector: 'app-doctor-create-referral',
  templateUrl: './doctor-create-referral.component.html',
  styleUrls: ['./doctor-create-referral.component.css']
})
export class DoctorCreateReferralComponent implements OnInit{

    selectedOption: string = '';
    departmentFromId: number = 0;
    departmentToId: number = 0;
    doctorId: number = 0;
    prescriptionAnalyses: string = '';

    prescriptionAnalyses1: PrescriptionAnalysis = new PrescriptionAnalysis();
    prescriptionArray: PrescriptionAnalysis[] = [];

    page = 0
    pageSize = 5
    total = 0
    paramsPage: Page<ParameterDto> = new Page<ParameterDto>()
    paramsList: ParameterDto[] = []

    lbz = '';
    lbp = '';

    analysisSaBeka: LabAnalysisDto[] = [];
    analysisParams: ParameterDto[] = [];

    selectedAnalysis: number  = 0;

    // hospitals: HospitalShort[] = [];
    // selectedHospital: HospitalShort = new HospitalShort();

    hospitals: DeparmentShort[] = []
    selectedHospital : number =  0;
    departments: DeparmentShort[] = [];

    selectedDepartment: string = '';

    referralForm:  FormGroup;
    userEdit: AdminPromeniZaposlenog = new AdminPromeniZaposlenog();

    pageHospital = 0
    pageSizeHospital = 99999
    totalHospital = 0
    hospitalPage: Page<DeparmentShort> = new Page<DeparmentShort>()




  constructor(private prescriptionService : PrescriptionServiceService, private laboratoryService: LaboratoryService, private authService: AuthService, private userService: UserService, private patientService: PatientService, private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute) {
    this.referralForm = this.formBuilder.group({
        ustanova: ['', [Validators.required]],
        ustanova1: [new DeparmentShort(), [Validators.required]],
        ustanova2: [new HospitalShort(), [Validators.required]],
        ustanova3: [new HospitalShort(), [Validators.required]],
        analysis: [new LabAnalysisDto(), [Validators.required]],
        comment: ['', [Validators.required]],
        refferalDiagnosis: ['', [Validators.required]],
        referralReason: ['', [Validators.required]],
        prescriptionAnalysisDtos: ['', [Validators.required]]
      });
    }
    // onOptionSelected(value: string) {
    //     this.selectedOption = value;
    // }

    isPopupVisible = false;

    ngOnInit(): void {
      this.lbp = <string>this.route.snapshot.paramMap.get('lbp');
      console.log(this.lbp);
      this.getDepartments();
       // this.getHospitals();
       this.lbz = this.authService.getLBZ();
       console.log(this.lbz);
       this.getLabAnalysis();
       this.getDoctorDepartment()
    }

  getDoctorDepartment():void{
    this.userService.getEmployee(this.lbz).subscribe(result => {},
      err => {
        if (err.status == 302) { // found!
          this.userEdit = err.error;
          console.log(this.userEdit)
          this.departmentFromId = this.userEdit.department.id
          console.log(this.departmentFromId)
        }
      })
  }

   //  getHospitals(): void {
   //   this.userService.getHospitals().subscribe(res=>{
   //      this.hospitals = res;
   //   });
   // }

    showPopup(event: any): void {
        this.isPopupVisible = true;
    }

    hidePopup(): void {
        this.isPopupVisible = false;
    }

    confirmUput(): void {
        const referral = this.referralForm.value;
        console.log("uput potvrdjen");
        console.log(this.selectedAnalysis);
        console.log("selected params: "+ this.selectedParams);

        this.prescriptionAnalyses1.analysisId = this.selectedAnalysis;
        this.prescriptionAnalyses1.parametersIds = this.selectedParams;

        this.prescriptionArray.push(this.prescriptionAnalyses1);

        console.log(this.prescriptionAnalyses1)

        // this.patientService.writePerscription(PrescriptionType.LABORATORIJA, this.doctorId,this.departmentFromId,this.departmentToId,this.lbp,
        //   new Date(),1,referral.comment, '','',this.prescriptionArray ).subscribe(res=>{
        //   console.log(res)
        // });
      this.prescriptionService.writeLabPerscription(
        this.lbz, this.departmentFromId, this.departmentToId, this.lbp, referral.comment, this.prescriptionArray
      ).subscribe(res=>{
          console.log(res)
        }
      );

    }

  getDepartments(): void {
    this.userService.getDepartments().subscribe(res=>{
      this.departments = res;
    });
  }
   getLabAnalysis(): void{
      console.log("dosao do ts");
     this.laboratoryService.getAnalysis().subscribe(res=>{
       this.analysisSaBeka = res;
     });
     console.log("prosao ts");
   }


  getParams(){
    this.laboratoryService.getAnalysisParams(this.selectedAnalysis, this.page, this.pageSize).subscribe((response) => {
      this.paramsPage = response
      this.paramsList = this.paramsPage.content
      this.total = this.paramsPage.totalElements
      console.log(this.paramsList)
    })
  }


  getHospitalsByDepName(){
      console.log("name "+ this.selectedDepartment)

    this.userService.getDepartmentForRefferal(this.selectedDepartment, this.page, this.pageSize).subscribe((res) => {

      this.hospitalPage = res
      this.hospitals = this.hospitalPage.content
      this.totalHospital = this.paramsPage.totalElements
      console.log(this.hospitals)

    })
  }


  selectedParams = [];

  onCheckboxChange(event: any, id: number) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      // @ts-ignore
      this.selectedParams.push(id);
    } else {
      // @ts-ignore
      const index = this.selectedParams.indexOf(id);
      if (index !== -1) {
        this.selectedParams.splice(index, 1);
      }
    }
  }


  onCheckboxChangeForHospital(event: any, id: number) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      // @ts-ignore
      this.departmentToId = id;

      console.log("departmentToId "+this.departmentToId)
    } else {
      // @ts-ignore
      this.departmentToId = null;
    }
  }


  onDepartmentSelected(event: any) {
    this.selectedDepartment = event.target.value; // Update the selectedDepartment property with the new value
  }



}
