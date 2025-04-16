import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseLibPage } from './exercise-lib.page';

describe('ExerciseLibPage', () => {
  let component: ExerciseLibPage;
  let fixture: ComponentFixture<ExerciseLibPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExerciseLibPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
