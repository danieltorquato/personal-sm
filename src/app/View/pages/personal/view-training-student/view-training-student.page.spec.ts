import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewTrainingStudentPage } from './view-training-student.page';

describe('ViewTrainingStudentPage', () => {
  let component: ViewTrainingStudentPage;
  let fixture: ComponentFixture<ViewTrainingStudentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTrainingStudentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
