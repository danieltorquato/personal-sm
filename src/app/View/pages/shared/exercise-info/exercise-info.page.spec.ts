import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseInfoPage } from './exercise-info.page';

describe('ExerciseInfoPage', () => {
  let component: ExerciseInfoPage;
  let fixture: ComponentFixture<ExerciseInfoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExerciseInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
