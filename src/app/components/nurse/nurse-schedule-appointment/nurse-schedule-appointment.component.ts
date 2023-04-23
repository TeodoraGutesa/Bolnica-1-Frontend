import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionEventArgs, CellClickEventArgs, EventClickArgs, EventSettingsModel, PopupOpenEventArgs, ScheduleComponent, View } from '@syncfusion/ej2-angular-schedule';
import { L10n } from "@syncfusion/ej2-base";
import { PatientService } from "../../../services/patient-service/patient.service";
import { UserService } from "../../../services/user-service/user.service";
import { ExaminationService } from "../../../services/examination-service/examination.service";
import { Patient } from "../../../models/patient/Patient";
import { Page } from "../../../models/models";
import { DoctorDepartmentDto } from "../../../models/DoctorDepartmentDto";
import { ScheduleExam } from "../../../models/patient/ScheduleExam";
import * as moment from 'moment';
import { PatientArrival } from "../../../models/laboratory-enums/PatientArrival";
import { event } from 'cypress/types/jquery';
import { SnackbarServiceService } from 'src/app/services/snackbar-service.service';


L10n.load({
  'en-US': {
    'schedule': {
      'saveButton': 'Sacuvaj',
      'cancelButton': 'Otkazi',
      'deleteButton': 'Remove',
      'newEvent': 'Pregled',
    }
  }
});

@Component({
  selector: 'app-nurse-schedule-appointment',
  //template: '<ejs-schedule height="700" width="1200" [currentView]="setView"></ejs-schedule>',
  templateUrl: './nurse-schedule-appointment.component.html',
  styleUrls: ['./nurse-schedule-appointment.component.css']
})
export class NurseScheduleAppointmentComponent implements OnInit {

  @ViewChild('scheduleObj', { static: false }) scheduleObj: ScheduleComponent | undefined;

  public setView: View = 'Month';

  public eventSettings: EventSettingsModel = {
    dataSource: [],
    fields: {
      id: 'Id',
      subject: {
        name: 'Subject',
        validation: { required: true }
      },
      startTime: {
        name: 'StartTime',
        validation: { required: true }
      },
      endTime: {
        name: 'EndTime',
        validation: { required: true }
      }
    }
  };

  subject: string = '';
  note: string = '';
  patient: string = '';
  selectedDoctor: string = '';
  selectedDateTime: Date = new Date();
  lbz: string = '';
  lbp: string = '';
  doctors: DoctorDepartmentDto[] = [];
  patientList: Patient[] = []
  nurseDepartmentPbo: string = '';
  responseExams: ScheduleExam[] = [];

  page = 0
  pageSize = 5
  total = 0
  patientPage: Page<Patient> = new Page<Patient>()

  editMenu: boolean = false;

  constructor(private patientService: PatientService, private snackBar: SnackbarServiceService, private userService: UserService, private examinationService: ExaminationService) {

  }

  ngOnInit(): void {
    // @ts-ignore
    this.lbz = localStorage.getItem('LBZ').toString()
    this.addEventsData();
    this.getPatientList();
    this.getNurseDepartment();
  }

  getNurseDepartment(): void {

    this.userService.getEmployee(this.lbz).subscribe(res => { },
      err => {
        if (err.status == 302) { // found!
          this.nurseDepartmentPbo = err.error.department.pbo;
          console.log("department " + this.nurseDepartmentPbo)

          this.getDoctors()
        }
      })
  }

  getDoctors(): void {
    this.examinationService.getDoctorsByDepartment(this.nurseDepartmentPbo).subscribe(res => {
      this.doctors = res
      console.log(this.doctors)
    })
  }

  getPatientList() {
    this.patientService.getAllPatients("", "", "", "", this.page, this.pageSize).subscribe((response) => {
      this.patientPage = response
      this.patientList = this.patientPage.content
      this.total = this.patientPage.totalElements
    })
  }


  public addEventsData(): void {

    // let events: Record<string, any>[] = [
    //   { Id: 1,
    //     Subject: 'a',
    //     StartTime: new Date(2023, 3, 4, 9, 0),
    //     EndTime: new Date(2023, 3, 4, 9, 30) },
    //   { Id: 2,
    //     Subject: 'b',
    //     StartTime: new Date(2023, 3, 5, 15, 0),
    //     EndTime: new Date(2023, 3, 5, 15, 30) },
    //   { Id: 3,
    //     Subject: 'c',
    //     StartTime: new Date(2023, 3, 6, 9, 30),
    //     EndTime: new Date(2023, 3, 6, 10, 0) },
    //   { Id: 4,
    //     Subject: 'd',
    //     StartTime: new Date(2023, 3, 7, 11, 0),
    //     EndTime: new Date(2023, 3, 7, 13, 0) }
    // ];

    // this.eventSettings.dataSource = events;

    // this.eventSettings.dataSource.forEach(event => {
    //   // this.scheduleObj?.appendTo('#schedule');
    //   this.scheduleObj?.addEvent(event);
    //   this.scheduleObj?.refresh();
    //   console.log(event)
    // });

    console.log(this.selectedDoctor)

    this.examinationService.getScheduledExaminationByDoctor(
      this.selectedDoctor
    ).subscribe(res => {

      this.scheduleObj?.deleteEvent(this.scheduleObj?.eventsData)
      this.responseExams = res;

      this.responseExams.forEach(event => {
        // this.scheduleObj?.appendTo('#schedule');
        if (event.patientArrival.toString() !== 'OTKAZANO') {


          console.log("arrival " + event.patientArrival.valueOf())
          console.log("enum " + PatientArrival.OTKAZANO.valueOf())


          const eventData = {
            Id: (<Record<string, any>>this.eventSettings.dataSource)['length'] + 1,
            Subject: this.subject,
            StartTime: event.dateAndTime,
            EndTime: moment(event.dateAndTime).add(30, 'minutes').toDate(),
            Note: this.note,
            Patient: event.lbp
          };

          this.scheduleObj?.addEvent(eventData);
          this.scheduleObj?.refresh();
          console.log(event)

        }



      });
    });

  }


  public onSave(): void {

    const eventData = {
      Id: (<Record<string, any>>this.eventSettings.dataSource)['length'] + 1,
      Subject: this.note,
      StartTime: this.selectedDateTime,
      EndTime: new Date(this.selectedDateTime.getTime() + (30 * 60 * 1000)),
      Note: this.note,
      Patient: this.patient
    };


    this.examinationService.createExamination(this.selectedDateTime, this.selectedDoctor, this.patient, this.note).subscribe(res => {
      console.log(res)
      this.snackBar.openSuccessSnackBar("Uspesno!")
    }, err => {
      this.snackBar.openErrorSnackBar("Greska!")
    })

    // console.log(eventData.StartTime)
    // console.log(eventData.EndTime)
    // console.log(eventData.Id)

    this.scheduleObj?.addEvent(eventData);
    this.scheduleObj?.refresh();
    this.scheduleObj?.closeEditor();

  }

  public onCancel(): void {
    this.scheduleObj?.closeEditor();
  }

  public onPopupOpen(args: PopupOpenEventArgs): void {
    if (args.type === 'QuickInfo') {
      args.cancel = true;
      let data = args.data as { [key: string]: Object };
      if (!this.updateEJSView()) {
        this.scheduleObj?.openEditor(data, 'Add');
        this.editMenu = false;
      }
      else {
        this.scheduleObj?.openEditor(this.eventsOnCellClick[0], 'Add');
        this.editMenu = true;
      }
    }
    if (args.type === 'Editor') {
      setTimeout(() => {
        const saveButton = args.element.querySelector('.e-event-save') as HTMLElement;
        const cancelButton = args.element.querySelector('.e-event-cancel') as HTMLElement;

        if (saveButton) {
          saveButton.style.display = 'none';
        }
        if (cancelButton) {
          cancelButton.style.display = 'none';
        }
      });

    }
  }
  eventsOnCellClick: Record<string, any>[] = [];
  onCellClick(args: CellClickEventArgs): void {
    this.selectedDateTime = args.startTime;
    this.eventsOnCellClick = this.scheduleObj!.getEvents(args.startTime, args.endTime);
  }

  updateEJSView(): boolean {
    if (this.eventsOnCellClick.length == 0) {
      return false;
    } else {
      const eventData = this.eventsOnCellClick[0];
      this.patient = eventData['Patient']
      this.note = eventData['Note']
      this.selectedDateTime = eventData['StartTime']
      return true;
    }

  }
  onEdit(): void {
    // TODO: Sta da se desi kada se klikne izmeni se pise ovde
  }

  public onEventClick(args: EventClickArgs): void {
    this.eventsOnCellClick[0] = args.event
    this.editMenu = true;
  }

}
