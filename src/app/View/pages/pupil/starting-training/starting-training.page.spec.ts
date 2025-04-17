import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StartingTrainingPage } from './starting-training.page';

describe('StartingTrainingPage', () => {
  let component: StartingTrainingPage;
  let fixture: ComponentFixture<StartingTrainingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StartingTrainingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
